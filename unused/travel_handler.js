import { EmbedBuilder } from 'discord.js';
import { PlayerMovementManager } from '../manager/player_movement_manager.js';
import { RegionManager } from '../manager/region_manager.js';
import { CharacterManager } from "../manager/character_manager.js";
import { saveCharacterLocation } from '../db/mysql.js';

export async function handleTravelInteraction(interaction) {
    try {
      const regionName = interaction.options.getString('region');
      if (!regionName) {
        return interaction.reply({ content: 'No region selected.', ephemeral: true });
      }
  
      const userId = interaction.user.id;
      const playerMoveManager = PlayerMovementManager.getInstance();
      const characterManager = CharacterManager.getInstance();
      const activeCharacter = characterManager.getActiveCharacter(userId);
  
      if (!activeCharacter) {
        return interaction.reply({ content: 'You do not have an active character!', ephemeral: true });
      }
  
      const curLocation = playerMoveManager.getLocation(userId, activeCharacter.id);
      const regionManager = RegionManager.getInstance();
  
      const targetRegionId = convertNameToRegionId(regionName);
      const paths = regionManager.getPathsFromRegion(curLocation.regionId, curLocation.locationId);
      const validStartLocation = Array.from(paths.keys()).find(
        key => key === String(curLocation.locationId)
      );
      const targetPath = paths.get(validStartLocation)?.find(path => path.regionId === targetRegionId);
  
      if (!targetPath) {
        return interaction.reply({ content: `Cannot travel to the selected region: ${regionName}.`, ephemeral: true });
      }
  
      const { locationId: targetLocationId } = targetPath;
      playerMoveManager.moveRegion(userId, activeCharacter.id, targetRegionId, targetLocationId);
      saveCharacterLocation(userId, activeCharacter.id, { regionId: targetRegionId, locationId: targetLocationId });
  
      const targetRegion = regionManager.getRegionById(targetRegionId);
      const embed = new EmbedBuilder()
        .setTitle('Travel Complete')
        .setDescription(`You have traveled to **${targetRegion.name}**.`)
        .setColor(0x00FF00);
  
      await interaction.reply({ embeds: [embed], ephemeral: true });
    } catch (error) {
      console.error('Error in travel handler:', error);
      await interaction.reply({ content: `An error occurred: ${error.message}`, ephemeral: true });
    }
  }
  