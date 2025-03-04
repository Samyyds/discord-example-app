import { ActionRowBuilder, ButtonBuilder } from 'discord.js';
import { TutorialManager } from '../manager/tutorial_manager.js';

export async function handleTutorialNextButtonInteraction(interaction) {
  if (!interaction.isButton()) return;
  if (interaction.customId === 'tutorial_next') {
    const tutorial = TutorialManager.getInstance().getTutorialForUser(interaction.user.id);
    if (!tutorial) {
      await interaction.reply({ content: "No active tutorial found.", ephemeral: true });
      return;
    }

    const message = interaction.message;
    if (message.components && message.components.length > 0) {
      const newComponents = message.components.map(row => {
        const newRow = ActionRowBuilder.from(row);
        newRow.components = newRow.components.map(compData => {
          const button = ButtonBuilder.from(compData);
          if (button.data.custom_id === 'tutorial_next') {
            button.setDisabled(true);
          }
          return button;
        });
        return newRow;
      });
      await interaction.update({ components: newComponents });
    } else {
      await interaction.deferUpdate();
    }
    tutorial.currentStep++;
    await tutorial.processStep();
  }
}
