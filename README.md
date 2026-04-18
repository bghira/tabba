# Tabba
<img width="1375" height="379" alt="image" src="https://github.com/user-attachments/assets/7d1d4d36-4057-4373-beba-79892367b406" />

Tabba is a local-first browser app for creating, editing, and viewing guitar and
bass tablature for Suno song stem exports.

The app is being built as an assisted editor: analysis may suggest events and
fingerings, but the musician chooses the final tab.

## Development

Install dependencies:

```sh
npm install
```

Start the local development server:

```sh
npm run dev
```

Run tests:

```sh
npm test
```

Run tests with coverage:

```sh
npm run test:coverage
```

Run linting:

```sh
npm run lint
```

Build for production:

```sh
npm run build
```

## Planning

- [Agent guidance](AGENTS.md)
- [Execution plan](EXECUTION_PLAN.md)
- [Roadmap milestones](docs/roadmap/MILESTONES.md)
- [First implementation slice](docs/roadmap/FIRST_IMPLEMENTATION_SLICE.md)

## Project Files

Tabba project exports use versioned `.tabba.json` data. The current schema
keeps stems, tab tracks, detected pitch data, chosen tab positions, candidates,
confidence, and lock state separate so analysis suggestions can be corrected
without losing the original project structure.
