# SIGIL-PS Core
This is the repository for the backend component of the conversational agent SIGIL-PS (or just Sigil), developed by NAU's RESHAPE Lab.

## Setup
The server and database have been containerized via Docker. You will need to have Docker installed to run it.

Once you have Docker, you will have to set up your environment variables. Copy the `.env.template` file, rename it `.env`, and fill in the missing variables.

Then, to run it, run the following command in the root directory of the project:

```bash
docker-compose up --build
```

The server should be running on port 5000.