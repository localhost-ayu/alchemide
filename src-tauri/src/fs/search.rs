use std::collections::BTreeSet;
use std::path::Path;

use grep::matcher::Matcher;
use grep::regex::{RegexMatcher, RegexMatcherBuilder};
use grep::searcher::sinks::UTF8;
use grep::searcher::{BinaryDetection, SearcherBuilder};
use ignore::WalkBuilder;
use regex::{NoExpand, Regex, RegexBuilder};
use serde::{Deserialize, Serialize};

use crate::error::{Error, Result};

const PREVIEW_LIMIT: usize = 300;

#[derive(Debug, Clone, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct SearchQuery {
    pub text: String,
    pub regex: bool,
    pub case_sensitive: bool,
}

#[derive(Debug, Clone, PartialEq, Serialize)]
#[serde(rename_all = "camelCase")]
pub struct SearchMatch {
    pub path: String,
    pub relative: String,
    pub line: u64,
    pub preview: String,
    pub ranges: Vec<(usize, usize)>,
}

fn check_query(query: &SearchQuery) -> Result<()> {
    if query.text.is_empty() {
        return Err(Error::EmptySearch);
    }
    Ok(())
}

pub fn build_matcher(query: &SearchQuery) -> Result<RegexMatcher> {
    check_query(query)?;
    RegexMatcherBuilder::new()
        .fixed_strings(!query.regex)
        .case_insensitive(!query.case_sensitive)
        .build(&query.text)
        .map_err(|error| Error::InvalidPattern(error.to_string()))
}

pub fn build_regex(query: &SearchQuery) -> Result<Regex> {
    check_query(query)?;
    let pattern = if query.regex {
        query.text.clone()
    } else {
        regex::escape(&query.text)
    };
    RegexBuilder::new(&pattern)
        .case_insensitive(!query.case_sensitive)
        .build()
        .map_err(|error| Error::InvalidPattern(error.to_string()))
}

fn utf16_offset(text: &str, byte: usize) -> usize {
    text[..byte].encode_utf16().count()
}

fn preview_of(line: &str, matcher: &RegexMatcher) -> (String, Vec<(usize, usize)>) {
    let trimmed = line.trim_end_matches(['\r', '\n']);
    let cut = trimmed
        .char_indices()
        .nth(PREVIEW_LIMIT)
        .map_or(trimmed.len(), |(index, _)| index);
    let preview = &trimmed[..cut];
    let mut ranges = Vec::new();
    let _ = matcher.find_iter(preview.as_bytes(), |found| {
        ranges.push((
            utf16_offset(preview, found.start()),
            utf16_offset(preview, found.end()),
        ));
        true
    });
    (preview.to_string(), ranges)
}

pub fn search_files(
    root: &Path,
    matcher: &RegexMatcher,
    mut emit: impl FnMut(SearchMatch) -> bool,
) -> usize {
    let mut searcher = SearcherBuilder::new()
        .binary_detection(BinaryDetection::quit(b'\x00'))
        .line_number(true)
        .build();
    let walker = WalkBuilder::new(root)
        .hidden(false)
        .require_git(false)
        .filter_entry(|entry| entry.file_name() != ".git")
        .build();
    let mut total = 0;
    for entry in walker.filter_map(|result| result.ok()) {
        if !entry.file_type().is_some_and(|kind| kind.is_file()) {
            continue;
        }
        let path = entry.path();
        let relative = path
            .strip_prefix(root)
            .map(|relative| relative.to_string_lossy().replace('\\', "/"))
            .unwrap_or_default();
        let mut keep_going = true;
        let _ = searcher.search_path(
            matcher,
            path,
            UTF8(|line_number, line| {
                let (preview, ranges) = preview_of(line, matcher);
                total += 1;
                keep_going = emit(SearchMatch {
                    path: path.to_string_lossy().into_owned(),
                    relative: relative.clone(),
                    line: line_number,
                    preview,
                    ranges,
                });
                Ok(keep_going)
            }),
        );
        if !keep_going {
            break;
        }
    }
    total
}

pub fn replace_lines(
    text: &str,
    regex: &Regex,
    replacement: &str,
    expand: bool,
    lines: &BTreeSet<u64>,
) -> (String, usize) {
    let mut output = String::with_capacity(text.len());
    let mut count = 0;
    for (index, line) in text.split_inclusive('\n').enumerate() {
        let number = index as u64 + 1;
        if !lines.contains(&number) {
            output.push_str(line);
            continue;
        }
        let (body, ending) = split_ending(line);
        count += regex.find_iter(body).count();
        let replaced = if expand {
            regex.replace_all(body, replacement)
        } else {
            regex.replace_all(body, NoExpand(replacement))
        };
        output.push_str(&replaced);
        output.push_str(ending);
    }
    (output, count)
}

fn split_ending(line: &str) -> (&str, &str) {
    let body = line.trim_end_matches(['\r', '\n']);
    (body, &line[body.len()..])
}

#[cfg(test)]
mod tests {
    use super::*;
    use std::fs;
    use tempfile::TempDir;

    fn query(text: &str, regex: bool, case_sensitive: bool) -> SearchQuery {
        SearchQuery {
            text: text.into(),
            regex,
            case_sensitive,
        }
    }

    fn collect(root: &Path, query: &SearchQuery) -> Vec<SearchMatch> {
        let matcher = build_matcher(query).expect("matcher");
        let mut found = Vec::new();
        search_files(root, &matcher, |found_match| {
            found.push(found_match);
            true
        });
        found.sort_by(|a, b| (&a.relative, a.line).cmp(&(&b.relative, b.line)));
        found
    }

    fn project() -> TempDir {
        let dir = TempDir::new().expect("temp dir");
        fs::create_dir_all(dir.path().join("src")).expect("src");
        fs::create_dir_all(dir.path().join("dist")).expect("dist");
        fs::write(dir.path().join(".gitignore"), "dist\n").expect("gitignore");
        fs::write(
            dir.path().join("src/app.ts"),
            "const flask = 1;\nlet Flask = flask;\n",
        )
        .expect("app");
        fs::write(dir.path().join("dist/app.js"), "const flask = 1;\n").expect("dist");
        fs::write(dir.path().join("image.png"), b"flask\x00\x01binary").expect("binary");
        dir
    }

    #[test]
    fn finds_text_with_line_numbers_and_utf16_ranges() {
        let dir = project();
        let found = collect(dir.path(), &query("flask", false, true));
        let lines: Vec<_> = found
            .iter()
            .map(|m| (m.relative.as_str(), m.line, m.ranges.clone()))
            .collect();
        assert_eq!(
            lines,
            [
                ("src/app.ts", 1, vec![(6, 11)]),
                ("src/app.ts", 2, vec![(12, 17)])
            ]
        );
        assert_eq!(found[0].preview, "const flask = 1;");
    }

    #[test]
    fn respects_gitignore_and_skips_binary_files() {
        let dir = project();
        let found = collect(dir.path(), &query("flask", false, false));
        assert!(found.iter().all(|m| m.relative == "src/app.ts"));
    }

    #[test]
    fn honors_case_and_regex_options() {
        let dir = project();
        assert_eq!(
            collect(dir.path(), &query("flask", false, false))[1]
                .ranges
                .len(),
            2
        );
        assert_eq!(collect(dir.path(), &query("F.ask", true, true)).len(), 1);
        assert!(collect(dir.path(), &query("F.ask", false, true)).is_empty());
    }

    #[test]
    fn measures_ranges_in_utf16_units() {
        let dir = TempDir::new().expect("temp dir");
        fs::write(dir.path().join("a.md"), "ação 🧪 flask\n").expect("file");
        let found = collect(dir.path(), &query("flask", false, true));
        assert_eq!(found[0].ranges, vec![(8, 13)]);
    }

    #[test]
    fn stops_when_asked() {
        let dir = project();
        let matcher = build_matcher(&query("flask", false, false)).expect("matcher");
        let total = search_files(dir.path(), &matcher, |_| false);
        assert_eq!(total, 1);
    }

    #[test]
    fn rejects_empty_and_invalid_patterns() {
        assert!(matches!(
            build_matcher(&query("", false, true)),
            Err(Error::EmptySearch)
        ));
        assert!(matches!(
            build_matcher(&query("(", true, true)),
            Err(Error::InvalidPattern(_))
        ));
        assert!(build_matcher(&query("(", false, true)).is_ok());
    }

    #[test]
    fn replaces_only_the_selected_lines_keeping_line_endings() {
        let regex = build_regex(&query("flask", false, false)).expect("regex");
        let text = "flask one\r\nFlask two\r\nflask three";
        let lines = BTreeSet::from([1, 3]);
        let (output, count) = replace_lines(text, &regex, "tube", false, &lines);
        assert_eq!(output, "tube one\r\nFlask two\r\ntube three");
        assert_eq!(count, 2);
    }

    #[test]
    fn expands_groups_only_in_regex_mode() {
        let lines = BTreeSet::from([1]);
        let regex = build_regex(&query(r"(\w+)@lab", true, true)).expect("regex");
        assert_eq!(
            replace_lines("ana@lab", &regex, "$1@home", true, &lines).0,
            "ana@home"
        );
        let literal = build_regex(&query("a.b", false, true)).expect("regex");
        assert_eq!(
            replace_lines("a.b axb", &literal, "$0", false, &lines).0,
            "$0 axb"
        );
    }
}
