# Contributing to SADA9A

First off, thank you for considering contributing to SADA9A! It's people like you that make SADA9A such a great tool for the charitable sector in Mauritania.

## 📋 Table of Contents

- [Code of Conduct](#code-of-conduct)
- [How Can I Contribute?](#how-can-i-contribute)
- [Development Setup](#development-setup)
- [Coding Standards](#coding-standards)
- [Commit Guidelines](#commit-guidelines)
- [Pull Request Process](#pull-request-process)
- [Issue Guidelines](#issue-guidelines)
- [Community](#community)

## 📜 Code of Conduct

This project and everyone participating in it is governed by our Code of Conduct. By participating, you are expected to uphold this code. Please report unacceptable behavior to mhamed.bbh01@gmail.com.

### Our Pledge

We pledge to make participation in our project a harassment-free experience for everyone, regardless of:
- Age, body size, disability, ethnicity
- Level of experience, education
- Nationality, personal appearance
- Race, religion
  
### Our Standards

**Examples of behavior that contributes to a positive environment:**
- Using welcoming and inclusive language
- Being respectful of differing viewpoints and experiences
- Gracefully accepting constructive criticism
- Focusing on what is best for the community
- Showing empathy towards other community members

**Examples of unacceptable behavior:**
- The use of sexualized language or imagery
- Trolling, insulting/derogatory comments, and personal or political attacks
- Public or private harassment
- Publishing others' private information without explicit permission
- Other conduct which could reasonably be considered inappropriate

## 🤔 How Can I Contribute?

### Reporting Bugs

Before creating bug reports, please check the existing issues to avoid duplicates. When you create a bug report, include as many details as possible:

**Bug Report Template:**
```markdown
**Describe the bug**
A clear and concise description of what the bug is.

**To Reproduce**
Steps to reproduce the behavior:
1. Go to '...'
2. Click on '....'
3. Scroll down to '....'
4. See error

**Expected behavior**
A clear description of what you expected to happen.

**Screenshots**
If applicable, add screenshots to help explain your problem.

**Environment:**
 - OS: [e.g. Windows 11, macOS 14, Ubuntu 22.04]
 - Browser: [e.g. Chrome 120, Firefox 121, Safari 17]
 - Python Version: [e.g. 3.12]
 - Node Version: [e.g. 18.17.0]
 - Docker: [Yes/No, version if yes]

**Additional context**
Add any other context about the problem here.
```

### Suggesting Enhancements

Enhancement suggestions are tracked as GitHub issues. Create an issue and provide:

**Enhancement Suggestion Template:**
```markdown
**Is your feature request related to a problem?**
A clear description of what the problem is. Ex. I'm always frustrated when [...]

**Describe the solution you'd like**
A clear and concise description of what you want to happen.

**Describe alternatives you've considered**
A clear description of any alternative solutions or features you've considered.

**Additional context**
Add any other context, mockups, or screenshots about the feature request here.

**Potential Impact**
How will this feature benefit users/organizations/administrators?
```

### Pull Requests

1. Fork the repo and create your branch from `main`
2. Follow the development setup instructions
3. Make your changes
4. Add tests if applicable
5. Ensure the test suite passes
6. Update documentation as needed
7. Submit your pull request

## 🛠️ Development Setup

### Prerequisites

Ensure you have the following installed:
- **Python 3.12**
- **Node.js 18+**
- **PostgreSQL 15+** (or Supabase account)
- **Redis 7+** (or Upstash account)
- **Git**
- **Pipenv** (`pip install pipenv`)
- **Docker & Docker Compose** (optional)

### Option 1: Docker Setup (Recommended)

The fastest way to get started:
```bash
# Clone your fork
git clone https://github.com/YOUR_USERNAME/sadagha-github.git
cd sadagha-github

# Copy environment files
cp backend/.env.example backend/.env
cp recommendation_service/.env.example recommendation_service/.env
cp frontend/.env.example frontend/.env.local

# Edit .env files with your configuration
# See README.md Environment Variables section

# Build and start services
docker-compose up -d

# Run migrations
docker-compose exec backend python manage.py migrate

# Create superuser
docker-compose exec backend python manage.py createsuperuser

# View logs
docker-compose logs -f
```

**Services:**
- Backend: `http://localhost:8000`
- AI Service: `http://localhost:8001`
- Frontend: `http://localhost:5173` (run separately)

### Option 2: Manual Setup

#### Backend Setup
```bash
# Clone your fork
git clone https://github.com/YOUR_USERNAME/sadagha-github.git
cd sadagha-github/backend

# Create virtual environment
pip install pipenv
pipenv install --dev
pipenv shell

# Copy and configure environment
cp .env.example .env
# Edit .env with your settings

# Run migrations
python manage.py migrate

# Create superuser
python manage.py createsuperuser

# Start development server
python manage.py runserver
```

#### AI Microservice Setup
```bash
# Navigate to AI service
cd recommendation_service

# Install dependencies
pip install pipenv
pipenv install --dev
pipenv shell

# Configure environment
cp .env.example .env
# Edit .env

# Start server
uvicorn main:app --reload --host 0.0.0.0 --port 8001
```

#### Frontend Setup
```bash
# Navigate to frontend
cd frontend

# Install dependencies
npm install

# Configure environment
cp .env.example .env.local
# Edit .env.local

# Run linting
npm run lint

# Start development server
npm run dev
```

### Development Workflow
```bash
# Create a new branch for your feature
git checkout -b feature/your-feature-name

# Make your changes
# ... code code code ...

# Add and commit your changes
git add .
git commit -m "feat(scope): add new feature"

# Push to your fork
git push origin feature/your-feature-name

# Create a pull request on GitHub
```

### Types

- `feat`: New feature
- `fix`: Bug fix
- `docs`: Documentation changes
- `style`: Code style changes (formatting, missing semicolons, etc.)
- `refactor`: Code refactoring (neither fixes a bug nor adds a feature)
- `perf`: Performance improvements
- `test`: Adding or updating tests
- `build`: Changes to build system or dependencies
- `ci`: Changes to CI configuration files and scripts
- `chore`: Other changes that don't modify src or test files
- `revert`: Reverts a previous commit

### Scopes

Common scopes for SADA9A:
- `campaigns`: Campaign-related changes
- `donations`: Donation processing
- `volunteers`: Volunteer management
- `auth`: Authentication and authorization
- `api`: API endpoints
- `ui`: User interface components
- `db`: Database changes
- `docker`: Docker configuration
- `docs`: Documentation

### Commit Message Best Practices

- Use **present tense** ("add feature" not "added feature")
- Use **imperative mood** ("move cursor to..." not "moves cursor to...")
- First line should be **≤ 50 characters**
- Body should be **≤ 72 characters per line**
- Separate subject from body with a blank line
- Reference issues and pull requests liberally
- Explain **what** and **why**, not **how**

## 🔄 Pull Request Process

### Before Submitting

- [ ] Code follows project style guidelines
- [ ] Self-review completed
- [ ] Comments added to complex code sections
- [ ] Documentation updated (README, API docs, etc.)
- [ ] Tests added/updated and passing
- [ ] All tests pass locally
- [ ] No console warnings/errors
- [ ] Commit messages follow guidelines
- [ ] Branch is up-to-date with `main`
- [ ] Screenshots attached for UI changes

### PR Title Format

Follow the same convention as commit messages:
```
feat(campaigns): add export to Excel functionality
fix(auth): resolve OAuth token refresh issue
```

### PR Template

When creating a PR, use this template:
```markdown
## Description
Brief description of what this PR does and why it's needed.

## Type of Change
- [ ] Bug fix (non-breaking change which fixes an issue)
- [ ] New feature (non-breaking change which adds functionality)
- [ ] Breaking change (fix or feature that would cause existing functionality to not work as expected)
- [ ] Documentation update
- [ ] Performance improvement
- [ ] Code refactoring
- [ ] CI/CD changes
- [ ] Dependency updates

## Related Issues
Closes #(issue number)
Related to #(issue number)

## Testing Performed
Describe the testing you've done:
- [ ] Unit tests added/updated
- [ ] Integration tests added/updated
- [ ] Manual testing performed
- [ ] Tested on multiple browsers (if frontend)
- [ ] Tested with Docker
- [ ] Tested database migrations

**Test coverage:** X%

## Screenshots (if applicable)
### Before
[Screenshot or GIF]

### After
[Screenshot or GIF]

## Checklist
- [ ] Code follows style guidelines
- [ ] Self-reviewed my own code
- [ ] Commented complex code sections
- [ ] Updated documentation
- [ ] Added tests that prove my fix/feature works
- [ ] All new and existing tests pass
- [ ] No new warnings generated
- [ ] Branch is up-to-date with main
- [ ] Ready for review

## Additional Notes
Any additional information reviewers should know.

## Breaking Changes
If applicable, describe what breaks and how to migrate.

## Performance Impact
If applicable, describe performance implications.
```

### Review Guidelines

**For Reviewers:**
- Be respectful and constructive
- Explain the "why" behind suggestions
- Distinguish between "must fix" and "nice to have"
- Approve when satisfied, even if minor suggestions remain
- Test the changes when possible

**For Contributors:**
- Don't take feedback personally
- Ask questions if feedback is unclear
- Be open to different approaches
- Respond to all comments
- Mark conversations as resolved when addressed

## 🐛 Issue Guidelines

### Creating Issues

**Use templates when available:**
- Bug Report
- Feature Request
- Documentation Improvement
- Performance Issue

### Issue Title Examples

**Good Issue Titles:**
- ✅ `Bug: Payment fails for donations > 1M MRU`
- ✅ `Feature: Add campaign export to Excel`
- ✅ `Docs: Clarify volunteer matching algorithm`
- ✅ `Perf: Slow campaign list loading with 1000+ items`

**Bad Issue Titles:**
- ❌ `It doesn't work`
- ❌ `Add feature`
- ❌ `Help needed`
- ❌ `Question`

### Issue Labels

| Label | Description |
|-------|-------------|
| `bug` | Something isn't working |
| `enhancement` | New feature or request |
| `documentation` | Documentation improvements |
| `good first issue` | Good for newcomers |
| `help wanted` | Extra attention needed |
| `question` | Further information requested |
| `wontfix` | This will not be worked on |
| `duplicate` | Duplicate issue |
| `invalid` | Invalid issue |
| `priority:high` | High priority issue |
| `priority:low` | Low priority issue |
| `backend` | Backend-related issue |
| `frontend` | Frontend-related issue |
| `ai-service` | AI service-related issue |
| `docker` | Docker-related issue |

### Bug Report Template
```markdown
**Describe the bug**
A clear and concise description of what the bug is.

**To Reproduce**
Steps to reproduce the behavior:
1. Go to '...'
2. Click on '....'
3. Scroll down to '....'
4. See error

**Expected behavior**
What you expected to happen.

**Actual behavior**
What actually happened.

**Screenshots**
If applicable, add screenshots.

**Environment:**
 - OS: [e.g. Windows 11]
 - Browser: [e.g. Chrome 120]
 - Python: [e.g. 3.12]
 - Node: [e.g. 18.17.0]
 - Docker: [Yes/No]

**Additional context**
Any other relevant information.

**Error Logs**
```
Paste error logs here
```

**Possible Solution**
If you have ideas on how to fix this.
```

### Feature Request Template
```markdown
**Is your feature request related to a problem?**
A clear description of the problem. Ex. I'm always frustrated when [...]

**Describe the solution you'd like**
A clear description of what you want to happen.

**Describe alternatives you've considered**
Alternative solutions or features you've considered.

**Additional context**
Mockups, screenshots, or examples.

**Potential Impact**
How will this benefit:
- Donors:
- Organizations:
- Administrators:
- Platform:

**Implementation Complexity**
Your assessment of implementation difficulty (Low/Medium/High).

**Related Issues**
Link to related issues or PRs.
```

## 🌍 Community

### Communication Channels

- **GitHub Issues**: Bug reports and feature requests
- **GitHub Discussions**: General questions and discussions
- **Email**: mhamed.bbh01@gmail.com for private inquiries
- **Pull Requests**: Code contributions

### Getting Help

**Before asking for help:**
1. Check the [README](README.md)
2. Search existing issues
3. Search GitHub Discussions
4. Check the documentation

**When asking for help, provide:**
- Clear description of the problem
- Steps to reproduce
- What you've already tried
- Environment details (OS, versions, Docker, etc.)
- Relevant code snippets or error messages
- Screenshots if applicable

### Recognition

Contributors will be:
- Listed in [CONTRIBUTORS.md](CONTRIBUTORS.md)
- Mentioned in release notes
- Given credit in documentation
- Invited to join as maintainers (for consistent contributors)

## 📚 Additional Resources

### Documentation
- [Django Documentation](https://docs.djangoproject.com/)
- [Django REST Framework](https://www.django-rest-framework.org/)
- [FastAPI Documentation](https://fastapi.tiangolo.com/)
- [React Documentation](https://react.dev/)
- [Tailwind CSS](https://tailwindcss.com/docs)
- [Docker Documentation](https://docs.docker.com/)

### Learning Resources
- [Conventional Commits](https://www.conventionalcommits.org/)
- [Python PEP 8 Style Guide](https://pep8.org/)
- [Airbnb JavaScript Style Guide](https://github.com/airbnb/javascript)
- [React Best Practices](https://react.dev/learn)

### Tools
- **Python**: Black, flake8, isort, mypy
- **JavaScript**: ESLint, Prettier
- **Git**: Conventional Commits extension
- **Docker**: Docker Desktop, Docker Compose

## 📄 License

By contributing, you agree that your contributions will be licensed under the MIT License.

## 🙏 Thank You!

Your contributions make SADA9A better for everyone in the Mauritanian charitable sector. We appreciate your time and effort!

Whether you:
- Report a bug
- Submit a fix
- Propose a feature
- Improve documentation
- Help others in discussions

**You are making a difference!** 🎉

---

**Questions?** Reach out to us at mhamed.bbh01@gmail.com or open a GitHub Discussion.

**Ready to contribute?** Check out our [good first issues](https://github.com/medbbh/sadagha-github/labels/good%20first%20issue)!
