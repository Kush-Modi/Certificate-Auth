# Contributing to Certificate Authentication System

Thank you for your interest in contributing to the Hybrid Certificate Authentication & Verification System! This document provides guidelines and information for contributors.

## 🚀 Getting Started

### Prerequisites

- Node.js 18+ and npm 8+
- Git
- Basic knowledge of React, Node.js, and blockchain concepts

### Development Setup

1. **Fork and Clone**
   ```bash
   git clone https://github.com/your-username/Certificate-Auth.git
   cd Certificate-Auth
   ```

2. **Backend Setup**
   ```bash
   cd backend
   npm install
   cp .env.example .env
   # Edit .env with your configuration
   npm run dev
   ```

3. **Frontend Setup**
   ```bash
   cd frontend
   npm install
   npm start
   ```

## 📋 Development Guidelines

### Code Style

- Use **ESLint** and **Prettier** for code formatting
- Follow **Material-UI** design patterns
- Use **functional components** with React hooks
- Implement **error handling** for all API calls
- Add **JSDoc comments** for complex functions

### Commit Messages

Use conventional commit format:
```
type(scope): description

feat: add certificate verification endpoint
fix: resolve steganography extraction bug
docs: update API documentation
style: format code with prettier
refactor: improve blockchain service structure
test: add unit tests for crypto service
```

### Branch Naming

- `feature/description` - New features
- `fix/description` - Bug fixes
- `docs/description` - Documentation updates
- `refactor/description` - Code refactoring

## 🏗️ Architecture

### Backend Structure
```
backend/
├── config/          # Configuration files
├── routes/          # API route handlers
├── services/        # Business logic services
├── utils/           # Utility functions
└── server.js        # Main application entry
```

### Frontend Structure
```
frontend/src/
├── components/      # React components
├── utils/           # Utility functions
├── App.js           # Main application component
└── index.js         # Application entry point
```

## 🧪 Testing

### Backend Testing
```bash
cd backend
npm test
npm run test:coverage
```

### Frontend Testing
```bash
cd frontend
npm test
npm run test:coverage
```

### Manual Testing
1. Test certificate issuance flow
2. Test certificate verification flow
3. Test QR code scanning functionality
4. Test error handling scenarios

## 🔒 Security Considerations

### Sensitive Data
- **Never commit** private keys or sensitive configuration
- Use environment variables for API keys
- Implement proper input validation
- Use HTTPS in production

### Key Management
- Store private keys securely
- Implement key rotation policies
- Use hardware security modules (HSM) in production

## 📝 Documentation

### Code Documentation
- Add JSDoc comments for functions
- Document API endpoints with examples
- Include inline comments for complex logic

### User Documentation
- Update README.md for new features
- Create user guides for complex workflows
- Document deployment procedures

## 🐛 Bug Reports

When reporting bugs, please include:

1. **Environment details**
   - OS and version
   - Node.js version
   - Browser version (for frontend issues)

2. **Steps to reproduce**
   - Clear, numbered steps
   - Expected vs actual behavior

3. **Error messages**
   - Full error logs
   - Screenshots if applicable

4. **Additional context**
   - Related issues
   - Workarounds if any

## ✨ Feature Requests

When requesting features:

1. **Problem description**
   - What problem does this solve?
   - Who would benefit from this feature?

2. **Proposed solution**
   - How should this feature work?
   - Any design considerations?

3. **Alternatives considered**
   - What other approaches were considered?
   - Why is this approach preferred?

## 🔄 Pull Request Process

### Before Submitting
1. **Test your changes** thoroughly
2. **Update documentation** if needed
3. **Add tests** for new functionality
4. **Ensure code quality** with linting

### PR Template
```markdown
## Description
Brief description of changes

## Type of Change
- [ ] Bug fix
- [ ] New feature
- [ ] Breaking change
- [ ] Documentation update

## Testing
- [ ] Unit tests pass
- [ ] Manual testing completed
- [ ] No console errors

## Checklist
- [ ] Code follows style guidelines
- [ ] Self-review completed
- [ ] Documentation updated
- [ ] No sensitive data committed
```

### Review Process
1. **Automated checks** must pass
2. **Code review** by maintainers
3. **Testing** in development environment
4. **Approval** from at least one maintainer

## 🏆 Recognition

Contributors will be recognized in:
- README.md contributors section
- Release notes
- Project documentation

## 📞 Support

### Getting Help
- **GitHub Issues** for bug reports and feature requests
- **Discussions** for general questions
- **Email** kushmodi.0505@gmail.com for urgent issues

### Community Guidelines
- Be respectful and inclusive
- Help others learn and grow
- Share knowledge and best practices
- Follow the code of conduct

## 📄 License

By contributing, you agree that your contributions will be licensed under the MIT License.

---

Thank you for contributing to making digital certificates more secure! 🔐
