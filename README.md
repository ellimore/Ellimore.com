# Ellimore Discord Bot

A starter Discord license manager for software/projects you own or are authorized to manage.

## Railway setup
1. Upload `package.json`, `bot/index.js`, `.env.example`, and this README to the root of your GitHub repository, keeping `bot/index.js` in the `bot` folder.
2. Connect/redeploy the repository as a Railway Node.js service. Start command: `npm start`.
3. In Railway > service > Variables, add `DISCORD_TOKEN`, `CLIENT_ID` (Discord Application ID), and `GUILD_ID` (test server ID).
4. Invite the bot with `bot` and `applications.commands` scopes. Do not grant Administrator unless genuinely needed.
5. Logs should show `Registered Ellimore slash commands.` and `Logged in as ...`. Test `/status`.

## Security
Never commit or share your real bot token. Store it only in Railway Variables. If exposed, reset it in Discord Developer Portal immediately.

This starter stores license data in a local JSON file, which may not persist across redeploys. Use a persistent volume/database before relying on it for real licensing. Admin commands require Manage Server permission. Commands are registered to one guild for testing.
