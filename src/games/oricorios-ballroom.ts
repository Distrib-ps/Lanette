import type { IGameFile } from "../types/games";
import type { IPokemon } from "../types/pokemon-showdown";
import { Chain, game as chainGame } from "./templates/chain";

class OricoriosBallroom extends Chain {
	acceptsFormes: boolean = true;
	canReverseLinks: boolean = true;
    customText = "Oricorio wants a dancing partner for **[name]**.";

    getLinkStarts(link: IPokemon): string[] {
        if (link.types.length < 2) return [];
        return [link.types.slice()[0]];
    }

    getLinkEnds(link: IPokemon): string[] {
        if (link.types.length < 2) return [];
        return [link.types.slice()[1]];
    }
}

export const game: IGameFile<OricoriosBallroom> = Games.copyTemplateProperties(chainGame, {
    aliases: ["oricorios", "ballroom", "ob"],
    commandDescriptions: [Config.commandCharacter + "g [Pokemon]"],
    class: OricoriosBallroom,
	defaultOptions: ['freejoin', 'points'],
    description: "Players answer each round with a dual-type Pokemon whose primary type matches the secondary type of the previous Pokemon, or vice versa " +
        "(no repeats in a round)!",
    name: "Oricorio's Ballroom",
    mascots: ["Oricorio", "Oricorio-Pa'u", "Oricorio-Pom-Pom", "Oricorio-Sensu"],
	mascotPrefix: "Oricorio's",
});
