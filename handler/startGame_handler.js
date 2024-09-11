import pkg from 'discord.js';
const { PermissionsBitField } = pkg;

export async function handleStartGameInteraction(interaction) {
    await interaction.deferReply({ ephemeral: true });
    console.log(Object.keys(interaction));

    const member = interaction.member;
    const freeAccessChannelId = process.env.FREE_ACCESS_CHANNEL;
    const startHereChannelId = process.env.START_HERE_CHANNEL;
    const freeAccessChannel = interaction.guild.channels.cache.get(freeAccessChannelId);
    const startHereChannel = interaction.guild.channels.cache.get(startHereChannelId);

    if (!member || !freeAccessChannel || !startHereChannel) {
        await interaction.editReply({ content: "Error: Missing permissions or channel not found.", ephemeral: true });
        return;
    }

    try {
        if (startHereChannel) {
            await startHereChannel.permissionOverwrites.edit(member, {
                [PermissionsBitField.Flags.ViewChannel]: false,
            });
        }

        await freeAccessChannel.permissionOverwrites.edit(member, {
            [PermissionsBitField.Flags.ViewChannel]: true,
            [PermissionsBitField.Flags.SendMessages]: true
        });

        console.log(`Access granted to ${member.displayName} for #free-access channel.`);
        await interaction.followUp({ content: "#free-access channel is available now. Please go there and type /start to play the game.", ephemeral: true });

        // Delay to give time for the user to refresh their client
        // setTimeout(async () => {
        //     const tutorial = new Tutorial(interaction);
        //     tutorial.processStep();
        // }, 5000);

    } catch (error) {
        console.error('Failed to edit permissions or start tutorial:', error);
        await interaction.followUp({ content: "Failed to start the tutorial due to an error.", ephemeral: true });
    }
}
