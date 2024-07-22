import { EmbedBuilder, ActionRowBuilder, ButtonBuilder, ButtonStyle } from 'discord.js';
import fetch from 'node-fetch'; // Ensure you have 'node-fetch' installed to make HTTP requests

const patreonCheckSubscription = async (userId) => {
    const url = `https://www.patreon.com/api/oauth2/v2/identity?include=memberships&fields%5Bmember%5D=patron_status`;
    const headers = {
        'Authorization': `Bearer ${process.env.PATREON_ACCESS_TOKEN}`,
        'Content-Type': 'application/json'
    };

    try {
        const response = await fetch(url, { headers });
        const data = await response.json();
        // Check the actual response structure and implement logic accordingly
        return data?.some(member => member.patron_status === 'active_patron');
    } catch (error) {
        console.error('Failed to verify Patreon subscription:', error);
        return false;
    }
};

const subCommand = async (interaction) => {
    try {
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
            .setDescription('Click the button below to subscribe on Patreon and unlock premium features! After completing your payment, return here and reply with "confirm" to activate your subscription.')
            .addFields({ name: 'Exclusive Content', value: 'Gain access to exclusive members-only content and features!' });

        await interaction.reply({ embeds: [embed], components: [row], ephemeral: false });

        const filter = m => m.content.toLowerCase() === 'confirm' && m.author.id === interaction.user.id;
        const collector = interaction.channel.createMessageCollector({ filter, time: 30000, max: 1 });

        collector.on('collect', async m => {
            const verified = await patreonCheckSubscription(m.author.id);
            if (!verified) {
                await interaction.followUp({ content: 'Unable to verify Patreon subscription. Please ensure you have completed the payment.', ephemeral: true });
                return;
            }

            const freeMemberRole = interaction.guild.roles.cache.find(role => role.name === 'Free member');
            const subscriberRole = interaction.guild.roles.cache.find(role => role.name === 'Subscriber');

            if (!subscriberRole) {
                await interaction.followUp({ content: 'Subscriber role not found. Please contact an administrator.', ephemeral: true });
                return;
            }

            if (freeMemberRole && m.member.roles.cache.has(freeMemberRole.id)) {
                await m.member.roles.remove(freeMemberRole);
            }

            await m.member.roles.add(subscriberRole);
            await interaction.followUp({ content: 'Congratulations! You are now a subscriber!', ephemeral: true });
        });

        collector.on('end', collected => {
            if (collected.size === 0) {
                interaction.followUp({ content: 'Subscription confirmation timeout. Please try again.', ephemeral: true });
            }
        });

    } catch (error) {
        console.error('Error in subCommand:', error);
        await interaction.reply({ content: `An error occurred: ${error.message}`, ephemeral: true });
    }
};

export const subCommands = {
    sub: subCommand
};
