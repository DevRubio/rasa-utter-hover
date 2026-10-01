# Rasa Utter Hover

> Instantly preview RASA response texts by hovering over `utter_*` references in your code.

![Visual Studio Marketplace Version](https://img.shields.io/visual-studio-marketplace/v/oscarrubio.rasa-utter-hover)
![Visual Studio Marketplace Installs](https://img.shields.io/visual-studio-marketplace/i/oscarrubio.rasa-utter-hover)
![License](https://img.shields.io/github/license/YOUR_USERNAME/rasa-utter-hover)

## ✨ Features

### Hover Preview

Hover over any `utter_*` identifier in your Python actions, YAML stories, or Markdown files to see its response text directly in the editor — no need to open the domain file.

<!-- Replace with an actual screenshot/gif of your extension -->
<!-- ![Hover Preview](images/hover-demo.gif) -->

**Supported response properties:**

| Property | Display |
|----------|---------|
| `text` | 💬 Response text |
| `image` | 🖼️ Image URL |
| `buttons` | 🔘 Button title + payload |
| `custom` | ⚙️ JSON payload |

### Go to Definition

Each hover card includes a **clickable link** to the source YAML file. Click it to jump directly to the line where the utter response is defined.

### Multiple Variations

If an utter has multiple response variations, all of them are displayed and numbered in the hover card.

## 📦 Supported Project Layouts

The extension automatically searches for responses in:

- `domain.yml` / `domain.yaml` — single-file domain
- `domain/**/*.yml` / `domain/**/*.yaml` — split domain (recommended by RASA)

## 🚀 Getting Started

1. Install the extension from the [VS Code Marketplace](https://marketplace.visualstudio.com/items?itemName=oscarrubio.rasa-utter-hover).
2. Open a RASA project in VS Code.
3. Hover over any `utter_*` reference — done!

No configuration required. It works out of the box.

## 🗂️ Supported Languages

The hover provider is active in:

- **Python** — `actions.py`, custom action files
- **YAML** — stories, rules, domain files
- **Markdown** — NLU training data (legacy format)
- **Plain text**

## ⚙️ Extension Settings

This extension works with zero configuration. No settings needed.

## 📋 Requirements

- VS Code `1.138.0` or newer
- A RASA project with a `domain.yml` or `domain/` directory containing response definitions

## 🐛 Known Issues

- If responses are defined outside of `domain.yml` or `domain/**/*.yml`, they won't be detected. Open an [issue](https://github.com/YOUR_USERNAME/rasa-utter-hover/issues) if you need support for other paths.

## 📄 Release Notes

### 1.0.0

- 🎉 Initial release
- Hover preview for `utter_*` responses (text, images, buttons, custom payloads)
- Click-to-navigate to the source YAML definition
- Support for single-file and split-domain RASA projects
- Support for multiple response variations

## 🤝 Contributing

Contributions are welcome! Please open an issue or submit a pull request on [GitHub](https://github.com/YOUR_USERNAME/rasa-utter-hover).

## 📜 License

This project is licensed under the [MIT License](LICENSE).
