require('dotenv').config();
const { Client, GatewayIntentBits, Events, ChannelType, REST, Routes, SlashCommandBuilder, EmbedBuilder } = require('discord.js');

const TOKEN = process.env.TOKEN;
const CLIENT_ID = process.env.CLIENT_ID;
const GUILD_ID = process.env.GUILD_ID;

const allowedRoles = ['principal', 'principal adjoint', 'cpe', 'gi', 'secrétaire'];

const client = new Client({
  intents: [
    GatewayIntentBits.Guilds,
    GatewayIntentBits.GuildMessages,
    GatewayIntentBits.GuildMembers
  ]
});

// Enregistrement de la commande slash
const commands = [
  new SlashCommandBuilder()
    .setName('convocation')
    .setDescription('Envoyer une convocation')
    .addUserOption(option =>
      option.setName('membre')
        .setDescription('Personne convoquée')
        .setRequired(true))
    .addStringOption(option =>
      option.setName('raison')
        .setDescription('Motif de la convocation')
        .setRequired(true))
    .addChannelOption(option =>
      option.setName('salonvocal')
        .setDescription('Salon vocal concerné')
        .setRequired(true)
        .addChannelTypes(ChannelType.GuildVoice))
    .toJSON()
];

const rest = new REST({ version: '10' }).setToken(TOKEN);
(async () => {
  try {
    await rest.put(
      Routes.applicationGuildCommands(CLIENT_ID, GUILD_ID),
      { body: commands }
    );
    console.log('✅ Commande slash /convocation enregistrée avec succès.');
  } catch (error) {
    console.error('❌ Erreur lors de l’enregistrement de la commande :', error);
  }
})();

client.once(Events.ClientReady, () => {
  console.log(`🤖 Connecté en tant que ${client.user.tag}`);
});

client.on(Events.InteractionCreate, async interaction => {
  if (!interaction.isChatInputCommand()) return;

  if (interaction.commandName === 'convocation') {
    const membre = interaction.options.getUser('membre');
    const raison = interaction.options.getString('raison');
    const salonVocal = interaction.options.getChannel('salonvocal');

    const authorMember = await interaction.guild.members.fetch(interaction.user.id);
    const hasPermission = authorMember.roles.cache.some(role =>
      allowedRoles.includes(role.name.toLowerCase())
    );

    if (!hasPermission) {
      return interaction.reply({ content: '❌ Vous n’avez pas la permission d’utiliser cette commande.', ephemeral: true });
    }

    const embed = new EmbedBuilder()
      .setColor('#ff9900')
      .setTitle('📢 CONVOCATION')
      .setDescription(
        `👤 **Personne convoquée(s)** : ${membre}\n` +
        `📝 **Raison** : ${raison}\n` +
        `🕒 **Quand** : maintenant\n\n` +
        `**Merci de prévenir en mp si vous ne venez pas et pourquoi**\n\n` +
        `➡️ **Rendez-vous dans le salon vocal** : <#${salonVocal.id}> à l'heure écrite`
      )
      .setThumbnail(membre.displayAvatarURL());

    await interaction.reply({ embeds: [embed] });
    console.log(`✅ Convocation envoyée pour ${membre.username}`);
  }
});

client.login(process.env.TOKEN);
