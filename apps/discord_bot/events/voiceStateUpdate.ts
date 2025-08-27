import { CategoryChannel, ChannelType, Events, VoiceChannel, VoiceState } from "discord.js";

module.exports = {
    name: Events.VoiceStateUpdate,
    async execute(oldState: VoiceState, newState: VoiceState) {
        const categoryName = "Vocaux personnalisés";
        if (newState.channelId === process.env.DISCORD_CREATE_CHANNEL_ID) {
            const newCategory = await newState.guild.channels.create({
                name: categoryName,
                type: ChannelType.GuildCategory,
            })
            const channelName = `Vocal de ${newState.member?.user.displayName || newState.member?.user.username}`;
            const newChannel = await newState.guild.channels.create({
                name: channelName,
                type: ChannelType.GuildVoice,
                parent: newCategory.id,
            });
            console.log(`Nouveau canal créé: ${newChannel.name}`);

                const member = newState.member;
                if (member) {
                    await member.voice.setChannel(newChannel);
                }
            }
            const voiceChannels = newState.guild.channels.cache.filter(channel => channel.type === ChannelType.GuildVoice && channel.parent?.name === categoryName);
            const emptyChannel = voiceChannels.filter(channel => (channel.members as any).size === 0);
            if (emptyChannel.size > 0) {
                for (const [_, channel] of emptyChannel) {
                    await channel.delete();
                    const category = channel.parent as CategoryChannel;
                    if (category.children.cache.size === 0) {
                        await category.delete();
                    }
                }
            }
        }
    }