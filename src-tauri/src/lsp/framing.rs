const HEADER_END: &[u8] = b"\r\n\r\n";

pub fn encode(message: &str) -> Vec<u8> {
    let mut framed = format!("Content-Length: {}\r\n\r\n", message.len()).into_bytes();
    framed.extend_from_slice(message.as_bytes());
    framed
}

#[derive(Default)]
pub struct Decoder {
    buffer: Vec<u8>,
}

fn content_length(header: &[u8]) -> Option<usize> {
    String::from_utf8_lossy(header).lines().find_map(|line| {
        let (name, value) = line.split_once(':')?;
        if name.trim().eq_ignore_ascii_case("content-length") {
            value.trim().parse().ok()
        } else {
            None
        }
    })
}

fn find(haystack: &[u8], needle: &[u8]) -> Option<usize> {
    haystack
        .windows(needle.len())
        .position(|window| window == needle)
}

impl Decoder {
    pub fn push(&mut self, bytes: &[u8]) -> Vec<String> {
        self.buffer.extend_from_slice(bytes);
        let mut messages = Vec::new();
        while let Some(message) = self.next_message() {
            messages.push(message);
        }
        messages
    }

    fn next_message(&mut self) -> Option<String> {
        loop {
            let header_end = find(&self.buffer, HEADER_END)?;
            let body_start = header_end + HEADER_END.len();
            let Some(length) = content_length(&self.buffer[..header_end]) else {
                self.buffer.drain(..body_start);
                continue;
            };
            if self.buffer.len() < body_start + length {
                return None;
            }
            let body: Vec<u8> = self
                .buffer
                .drain(..body_start + length)
                .skip(body_start)
                .collect();
            return Some(String::from_utf8_lossy(&body).into_owned());
        }
    }
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn frames_a_message_with_its_length_in_bytes() {
        assert_eq!(
            encode(r#"{"a":"é"}"#),
            b"Content-Length: 10\r\n\r\n{\"a\":\"\xc3\xa9\"}".to_vec()
        );
    }

    #[test]
    fn decodes_messages_split_across_reads() {
        let framed = [encode(r#"{"id":1}"#), encode(r#"{"id":2}"#)].concat();
        let mut decoder = Decoder::default();

        let first = decoder.push(&framed[..5]);
        let rest = decoder.push(&framed[5..30]);
        let last = decoder.push(&framed[30..]);

        assert!(first.is_empty());
        assert_eq!(rest, vec![r#"{"id":1}"#.to_string()]);
        assert_eq!(last, vec![r#"{"id":2}"#.to_string()]);
    }

    #[test]
    fn decodes_several_messages_in_one_read_and_extra_headers() {
        let mut framed = b"Content-Type: application/vscode-jsonrpc; charset=utf-8\r\ncontent-length: 2\r\n\r\n{}".to_vec();
        framed.extend(encode("[]"));

        assert_eq!(
            Decoder::default().push(&framed),
            vec!["{}".to_string(), "[]".to_string()]
        );
    }

    #[test]
    fn keeps_a_multibyte_body_whole() {
        let framed = encode(r#""ação""#);
        let mut decoder = Decoder::default();

        assert!(decoder.push(&framed[..framed.len() - 3]).is_empty());
        assert_eq!(
            decoder.push(&framed[framed.len() - 3..]),
            vec![r#""ação""#.to_string()]
        );
    }

    #[test]
    fn skips_a_header_without_a_length() {
        let mut framed = b"X-Junk: 1\r\n\r\n".to_vec();
        framed.extend(encode("{}"));

        assert_eq!(Decoder::default().push(&framed), vec!["{}".to_string()]);
    }
}
