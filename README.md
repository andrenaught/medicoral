# Medicoral

## About

Electronic medical records (EMR) system. Schedule appointments and keep track of patient records.

[Demo](https://mdcor.andretn.com/) - u: testuser p: superdog

## Setup

1. `npm install`
2. Follow Backend & Frontend steps below
3. `npm run build`
4. `npm run start`

### Backend

- In `/backend` folder

1. `pipenv install`
2. Start pipenv environment `pipenv shell`
3. Create .env and set the variables `cp backend/.env.example backend/.env`
4. Setup database `python manage.py migrate`
5. Create super user `python manage.py createsuperuser`, use this account to log in to `localhost:8000/admin/` to create more accounts and manage the backend.

* Note that `pipenv shell` is necessary for running any of the installed python packages (like Django) in the cli. Django for example `pipenv shell` -> `python manage.py [command]`. To exit out of the shell, run `exit`.
  * Alternatively, `pipenv run python manage.py [command]` will also work.

### Frontend

- In `/frontend` folder

1. `npm install`
2. Create .env and set the variables `cp .env.example .env`

## Development

- For development mode follow the setup steps, but instead of `npm run build && npm run start` run `npm run dev`
- `npm run dev` defaults to ports:
  - `3000` for Frontend (React)
  - `8000` for Backend (Django)

- `npm run lint` to run linter on frontend

- Backend urls: 
  - Make sure to include the ending `/`
  - API Docs: `localhost:8000/docs/`
  - Admin: `localhost:8000/admin/`

## Production

- `npm run build` generates these files: `frontend/build` & `backend/static`
- `npm run start` defaults to port `8000`
