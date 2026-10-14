require("dotenv").config();
const { Client, GatewayIntentBits, REST, Routes, SlashCommandBuilder, PermissionFlagsBits, EmbedBuilder } = require("discord.js");
const crypto = require("crypto");
const fs = require("fs");
const path = require("path");

const { DISCORD_TOKEN, CLIENT_ID, GUILD_ID } = process.env;
if (!DISCORD_TOKEN || !CLIENT_ID || !GUILD_ID) {
  console.error("Set DISCORD_TOKEN, CLIENT_ID, and GUILD_ID in Railway Variables.");
  process.exit(1);
}
const dataDir = path.join(__dirname, "data");
const dbFile = path.join(dataDir, "licenses.json");
fs.mkdirSync(dataDir, { recursive: true });
if (!fs.existsSync(dbFile)) fs.writeFileSync(dbFile, JSON.stringify({ keys: {} }, null, 2));
const readDb = () => { try { return JSON.parse(fs.readFileSync(dbFile, "utf8")); } catch { return { keys: {} }; } };
const saveDb = db => fs.writeFileSync(dbFile, JSON.stringify(db, null, 2));
const newKey = () => `ELLI-${crypto.randomBytes(4).toString("hex").toUpperCase()}-${crypto.randomBytes(4).toString("hex").toUpperCase()}`;
const card = (title, description, color = 0x8B5CF6) => new EmbedBuilder()
  .setColor(color).setTitle(`ð£ Ellimore â¢ ${title}`).setDescription(description)
  .setFooter({ text: "Ellimore License Manager" }).setTimestamp();

const admin = PermissionFlagsBits.ManageGuild;
const commands = [
  new SlashCommandBuilder().setName("help").setDescription("Show Ellimore commands."),
  new SlashCommandBuilder().setName("status").setDescription("Check bot status."),
  new SlashCommandBuilder().setName("keygen").setDescription("Generate keys for your own software.")
    .addIntegerOption(o => o.setName("amount").setDescription("Number of keys (1-10)").setMinValue(1).setMaxValue(10).setRequired(true))
    .addStringOption(o => o.setName("product").setDescription("Your product name").setMaxLength(60).setRequired(true)).setDefaultMemberPermissions(admin),
  new SlashCommandBuilder().setName("redeem").setDescription("Redeem a license key.")
    .addStringOption(o => o.setName("key").setDescription("License key").setRequired(true)),
  new SlashCommandBuilder().setName("whitelist").setDescription("Assign a license to a user.")
    .addUserOption(o => o.setName("user").setDescription("User to authorize").setRequired(true))
    .addStringOption(o => o.setName("product").setDescription("Product name").setMaxLength(60).setRequired(true)).setDefaultMemberPermissions(admin),
  new SlashCommandBuilder().setName("mass-whitelist").setDescription("Assign licenses to up to 10 users.")
    .addStringOption(o => o.setName("users").setDescription("User mentions or IDs, separated by spaces/commas").setRequired(true))
    .addStringOption(o => o.setName("product").setDescription("Product name").setMaxLength(60).setRequired(true)).setDefaultMemberPermissions(admin),
  new SlashCommandBuilder().setName("unwhitelist").setDescription("Remove a user's license assignment.")
    .addUserOption(o => o.setName("user").setDescription("User to remove").setRequired(true))
    .addStringOption(o => o.setName("product").setDescription("Product name").setMaxLength(60).setRequired(true)).setDefaultMemberPermissions(admin),
  new SlashCommandBuilder().setName("keys").setDescription("List keys for a product (admin only).")
    .addStringOption(o => o.setName("product").setDescription("Product name").setMaxLength(60).setRequired(true)).setDefaultMemberPermissions(admin)
].map(c => c.toJSON());

(async () => {
  const rest = new REST({ version: "10" }).setToken(DISCORD_TOKEN);
  await rest.put(Routes.applicationGuildCommands(CLIENT_ID, GUILD_ID), { body: commands });
  console.log("Registered Ellimore slash commands.");
})().catch(e => { console.error("Command registration failed:", e); process.exit(1); });

const client = new Client({ intents: [GatewayIntentBits.Guilds] });
client.once("ready", () => console.log(`Logged in as ${client.user.tag}`));
client.on("interactionCreate", async i => {
  if (!i.isChatInputCommand()) return;
  try {
    const name = i.commandName;
    if (name === "status") return i.reply({ embeds: [card("Online", "â Ellimore is online and responding.")], ephemeral: true });
    if (name === "help") return i.reply({ embeds: [card("Commands",
      "`/status` â bot status\n`/redeem` â redeem a key\n`/keygen` â generate keys (Manage Server)\n`/whitelist` â assign a license\n`/mass-whitelist` â assign several licenses\n`/unwhitelist` â remove an assignment\n`/keys` â list keys")], ephemeral: true });

    const db = readDb();
    if (name === "keygen") {
      const amount = i.options.getInteger("amount"), product = i.options.getString("product").trim(), keys = [];
      for (let n = 0; n < amount; n++) {
        let k = newKey(); while (db.keys[k]) k = newKey();
        db.keys[k] = { product, createdBy: i.user.id, createdAt: new Date().toISOString(), assignedTo: null, redeemedBy: null };
        keys.push(k);
      }
      saveDb(db);
      return i.reply({ embeds: [card("Keys generated", `**Product:** ${product}\n\`\`\`\n${keys.join("\n")}\n\`\`\`\nKeep these keys private.`, 0x22C55E)], ephemeral: true });
    }
    if (name === "redeem") {
      const key = i.options.getString("key").trim().toUpperCase(), item = db.keys[key];
      if (!item) return i.reply({ embeds: [card("Invalid key", "That key was not found.", 0xEF4444)], ephemeral: true });
      if ((item.redeemedBy && item.redeemedBy !== i.user.id) || (item.assignedTo && item.assignedTo !== i.user.id))
        return i.reply({ embeds: [card("Key unavailable", "This key is assigned to another user or already redeemed.", 0xEF4444)], ephemeral: true });
      item.redeemedBy = i.user.id; item.redeemedAt = new Date().toISOString(); saveDb(db);
      return i.reply({ embeds: [card("Redeemed!", `Your license for **${item.product}** is linked to your Discord account.`, 0x22C55E)], ephemeral: true });
    }
    if (name === "whitelist") {
      const user = i.options.getUser("user"), product = i.options.getString("product").trim();
      const key = Object.keys(db.keys).find(k => db.keys[k].product.toLowerCase() === product.toLowerCase() && !db.keys[k].assignedTo && !db.keys[k].redeemedBy);
      if (!key) return i.reply({ embeds: [card("No available key", `Generate an unused key for **${product}** first.`, 0xEF4444)], ephemeral: true });
      db.keys[key].assignedTo = user.id; db.keys[key].assignedAt = new Date().toISOString(); saveDb(db);
      return i.reply({ embeds: [card("User authorized", `Assigned **${product}** to <@${user.id}>.\nKey: \`${key}\``, 0x22C55E)], ephemeral: true });
    }
    if (name === "mass-whitelist") {
      const raw = i.options.getString("users"), product = i.options.getString("product").trim();
      const ids = [...new Set(raw.match(/\d{17,20}/g) || [])].slice(0, 10);
      if (!ids.length) return i.reply({ embeds: [card("No users found", "Mention users or enter Discord user IDs.", 0xEF4444)], ephemeral: true });
      const lines = [];
      for (const id of ids) {
        const key = Object.keys(db.keys).find(k => db.keys[k].product.toLowerCase() === product.toLowerCase() && !db.keys[k].assignedTo && !db.keys[k].redeemedBy);
        if (!key) lines.push(`<@${id}> â no unused key`);
        else { db.keys[key].assignedTo = id; db.keys[key].assignedAt = new Date().toISOString(); lines.push(`<@${id}> â assigned`); }
      }
      saveDb(db);
      return i.reply({ embeds: [card("Mass whitelist results", lines.join("\n"))], ephemeral: true });
    }
    if (name === "unwhitelist") {
      const user = i.options.getUser("user"), product = i.options.getString("product").trim().toLowerCase(); let count = 0;
      for (const item of Object.values(db.keys)) if (item.product.toLowerCase() === product && (item.assignedTo === user.id || item.redeemedBy === user.id)) {
        item.assignedTo = null; item.redeemedBy = null; item.unwhitelistedAt = new Date().toISOString(); count++;
      }
      saveDb(db);
      return i.reply({ embeds: [card("Authorization removed", count ? `Removed ${count} assignment(s) for <@${user.id}>.` : "No matching assignments found.", count ? 0x22C55E : 0xF59E0B)], ephemeral: true });
    }
    if (name === "keys") {
      const product = i.options.getString("product").trim().toLowerCase();
      const found = Object.entries(db.keys).filter(([, v]) => v.product.toLowerCase() === product);
      if (!found.length) return i.reply({ embeds: [card("No keys", `No keys found for **${product}**.`)], ephemeral: true });
      const lines = found.slice(0, 20).map(([k, v]) => `\`${k}\` â ${v.assignedTo || v.redeemedBy ? "assigned/redeemed" : "unused"}`);
      return i.reply({ embeds: [card(`Keys â¢ ${product}`, lines.join("\n") + (found.length > 20 ? `\nâ¦and ${found.length - 20} more.` : ""))], ephemeral: true });
    }
  } catch (e) {
    console.error(`Error in /${i.commandName}:`, e);
    const msg = { content: "Something went wrong. Check Railway logs.", ephemeral: true };
    if (i.replied || i.deferred) await i.followUp(msg).catch(() => {}); else await i.reply(msg).catch(() => {});
  }
});
client.login(DISCORD_TOKEN);
