# Fix Pipenv Environment

## Steps to fix the typing-extensions issue:

1. **Update pipenv dependencies:**
```bash
cd recommendation_service
pipenv install typing-extensions>=4.8.0
```

2. **Or reinstall everything:**
```bash
pipenv install --dev
```

3. **Activate pipenv shell:**
```bash
pipenv shell
```

4. **Run the server:**
```bash
python main.py
```

## Alternative: Use pipenv run directly
```bash
pipenv run python main.py
```

## If still having issues, try:
```bash
pipenv uninstall typing-extensions
pipenv install typing-extensions==4.8.0
```

The issue is that your conda environment has an older typing-extensions that doesn't have the `Doc` attribute required by FastAPI 0.104.1.