# Changelog

All notable changes to the **Rasa Utter Hover** extension will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.1.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [1.0.0] - 2026-10-01

### Added

- Hover preview for `utter_*` references showing response text, images, buttons, and custom payloads.
- Click-to-navigate link in the hover card to jump to the source YAML definition at the exact line.
- Support for single-file domain (`domain.yml`) and split-domain (`domain/**/*.yml`) RASA project layouts.
- Support for multiple response variations displayed as numbered entries.
- Activation on Python, YAML, Markdown, and plain text files.