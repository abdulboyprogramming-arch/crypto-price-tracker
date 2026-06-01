# Contributing to Crypto Price Tracker

Thank you for your interest in contributing! This document provides guidelines for contributing to the project.

## Code of Conduct

Be respectful, inclusive, and professional. All contributors are expected to follow the [Code of Conduct](CODE_OF_CONDUCT.md).

## Getting Started

1. **Fork the repository**
   ```bash
   git clone https://github.com/abdulboyprogramming-arch/crypto-price-tracker.git
   cd crypto-price-tracker
   ```

2. **Create a feature branch**
   ```bash
   git checkout -b feature/your-feature-name
   ```

3. **Set up your environment**
   - For web app: No setup needed, just open in browser
   - For API: `pip install -r api-server/requirements.txt`
   - For extension: Load in Chrome DevTools

4. **Make your changes**
   - Write clean, readable code
   - Add comments for complex logic
   - Follow existing code style

5. **Test thoroughly**
   - Follow [TESTING_GUIDE.md](./TESTING_GUIDE.md)
   - Test all affected components
   - Check for breaking changes

6. **Commit with clear messages**
   ```bash
   git commit -m "feat: add amazing feature"
   ```

7. **Push to your branch**
   ```bash
   git push origin feature/your-feature-name
   ```

8. **Create a Pull Request**
   - Describe what you changed and why
   - Link any related issues
   - Request reviews from maintainers

## Commit Convention

Use conventional commits:

- `feat:` New feature
- `fix:` Bug fix
- `docs:` Documentation
- `style:` Code style (no logic change)
- `refactor:` Code refactor
- `test:` Test cases
- `chore:` Maintenance
- `ci:` CI/CD changes
- `perf:` Performance improvement
- `security:` Security fix

## Code Style

### JavaScript
- Use ES6+ features
- 2-space indentation
- Use semicolons
- Use `const` by default, `let` when needed
- Avoid `var`

### Python
- Follow PEP 8
- Use type hints
- 4-space indentation
- Document with docstrings

### CSS
- Use flexbox/grid for layouts
- 2-space indentation
- Use CSS variables for theming
- Mobile-first approach

## Testing Requirements

Before submitting a PR:

- [ ] Web app tested in Chrome, Firefox, Edge
- [ ] API endpoints tested with cURL/Postman
- [ ] Extension loads without errors
- [ ] No console errors in DevTools
- [ ] Responsive design tested on mobile
- [ ] Dark/light themes tested
- [ ] Offline mode tested (if applicable)

## Documentation

- Update README.md if you change features
- Add comments to complex code
- Update API docs if you change endpoints
- Keep CHANGELOG.md current

## Reporting Bugs

When reporting bugs, include:

1. Clear description of the bug
2. Steps to reproduce
3. Expected vs actual behavior
4. Browser/environment info
5. Screenshots if applicable
6. Console errors (if any)

## Feature Requests

For feature requests:

1. Describe the desired feature
2. Explain the use case
3. Suggest implementation approach
4. Consider backward compatibility

## Review Process

1. At least one maintainer reviews the PR
2. Changes requested? Update your branch
3. Approved? PR gets merged
4. Merged code auto-deploys

## Questions?

- Open an issue for discussion
- Email: adeeyoabdulrahman@gmail.com
- Check existing discussions first

Thank you for contributing! 🚀
