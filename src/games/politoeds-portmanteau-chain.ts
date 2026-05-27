import type { IGameAchievement, IGameFile } from "../types/games";
import { Chain, game as chainGame } from "./templates/chain";
import type { Link } from "./templates/chain";

type AchievementNames = "strongestlink";

class PolitoedsPortmanteauChain extends Chain {
	static achievements: KeyedDict<AchievementNames, IGameAchievement> = {
		"strongestlink": {name: "Strongest Link", type: 'special', bits: 1000, description: 'get every answer in one game (free-join only)'},
	};
	acceptsFormes: boolean = true;
	canReverseLinks: boolean = true;
	minLetters: number = 2;
	maxLetters: number = 4;
	allAnswersAchievement = PolitoedsPortmanteauChain.achievements.strongestlink;

	getLinkStarts(link: Link): string[] {
		const starts: string[] = [];
		const linkLength = link.id.length;
		for (let i = this.minLetters; i <= this.maxLetters; i++) {
			if (i > linkLength) break;
			const start = link.id.substr(0, i);
			if (!isNaN(parseInt(start))) continue;
			starts.push(start);
		}
		return starts;
	}

	getLinkEnds(link: Link): string[] {
		const ends: string[] = [];
		const linkLength = link.id.length;
		for (let i = this.minLetters; i <= this.maxLetters; i++) {
			if (i > linkLength) break;
			const end = link.id.substr(linkLength - i);
			if (!isNaN(parseInt(end))) continue;
			ends.push(end);
		}
		return ends;
	}
}

export const game: IGameFile<PolitoedsPortmanteauChain> = Games.copyTemplateProperties(chainGame, {
	aliases: ["politoeds", "politoedsportchain", "portmanteauchain", "portchain", "ppc"],
	commandDescriptions: [Config.commandCharacter + "g [Pokemon]"],
	class: PolitoedsPortmanteauChain,
	defaultOptions: ['freejoin', 'points'],
	description: "Players answer each round with a Pokemon that starts with the last 2-4 letters or ends with the first 2-4 letters of " +
		"the previous Pokemon (no repeats in a round)!",
	name: "Politoed's Portmanteau Chain",
	mascot: "Politoed",
});
