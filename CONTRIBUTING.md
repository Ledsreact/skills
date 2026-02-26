# Contributing to Ledsreact Skills

Thank you for your interest in contributing to Ledsreact Skills.

## How to Contribute

### Reporting Issues

- Use GitHub Issues to report bugs or suggest improvements
- Include as much detail as possible (skill name, expected vs. actual behavior, code examples)

### Submitting Changes

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/my-change`)
3. Make your changes
4. Test your changes thoroughly
5. Submit a pull request

### Skill Guidelines

When creating or modifying skills:

1. **Follow the format**: Use YAML frontmatter with `name`, `description`, and `metadata` fields
2. **Reference the API**: Always link to the OpenAPI spec and developer docs where relevant
3. **Include examples**: Provide working code examples that demonstrate the skill's guidance
4. **Keep SDKs current**: Verify code examples against the latest SDK versions
5. **Ask before assuming**: Skills that interact with the API should prompt for region (EU/US) and API key

### Code Style

- TypeScript examples should use `@ledsreact/sdk` patterns
- Python examples should use `ledsreact-sdk` patterns
- Raw API examples should reference the OpenAPI spec
- Include proper type annotations in all code examples

### Commit Messages

- Use clear, descriptive commit messages
- Reference issue numbers when applicable
- Keep commits focused on single changes

## License

By contributing, you agree that your contributions will be licensed under the project's proprietary license. See [LICENSE](LICENSE) for details.
