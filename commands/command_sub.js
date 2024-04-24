import { EmbedBuilder } from 'discord.js';

const subCommand = async (interaction) => {
    try {
        if (interaction.channel.name !== 'subscription') {
            await interaction.reply({ content: 'Please use the /sub command within the subscription channel.', ephemeral: true });
            return;
        }

        const embed = new EmbedBuilder()
            .setColor(0x0099FF)
            .setTitle('Subscribe to Unlock Premium Features')
            .setDescription('Welcome to Merfolk & Magic. Here you can explore, craft, and fight. To confirm your subscription, reply with "confirm".')
            .addFields(
                { name: 'Exclusive Content', value: 'Gain access to exclusive members-only content and features!' }
            );

        await interaction.reply({ embeds: [embed], ephemeral: false });

        const filter = m => m.content.toLowerCase() === 'confirm' && m.author.id === interaction.user.id;
        const collector = interaction.channel.createMessageCollector({ filter, time: 30000, max: 1 });

        collector.on('collect', async m => {
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
