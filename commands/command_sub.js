import { EmbedBuilder, ActionRowBuilder, ButtonBuilder, ButtonStyle } from 'discord.js';

const subCommand = async (interaction) => {
    if (interaction.channel.name !== 'subscription') {
        await interaction.reply({ content: 'Please use the /sub command within the subscription channel.', ephemeral: true });
        return;
    }

    const patreonURL = 'https://www.patreon.com/MerfolkAndMagic';
    const button = new ButtonBuilder()
        .setLabel('Subscribe on Patreon')
        .setStyle(ButtonStyle.Link)
        .setURL(patreonURL);
    const row = new ActionRowBuilder().addComponents(button);

    const embed = new EmbedBuilder()
        .setColor(0x0099FF)
        .setTitle('Subscribe to Unlock Premium Features')
        .setDescription('Click the button below to subscribe on Patreon and unlock premium features!')
        .addFields({ name: 'Exclusive Content', value: 'Gain access to exclusive members-only content and features!' });

    await interaction.reply({ embeds: [embed], components: [row], ephemeral: true });
};

export const subCommands = {
        sub: subCommand
    };

