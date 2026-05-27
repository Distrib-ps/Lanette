import type { Player } from '../room-activity';
import type { IGameAchievement, IGameFile } from "../types/games";
import type { ICard, IPokemonCard } from "./templates/card";
import { CardCloseFar, game as cardGame } from "./templates/card-close-far";

type AchievementNames = "closecaller";

class CradilysCloseupCards extends CardCloseFar {
	static achievements: KeyedDict<AchievementNames, IGameAchievement> = {
		"closecaller": {name: "Close Caller", type: 'special', bits: 1000, repeatBits: 250, description: 'win a round with a 1 point difference 3 times in one game'},
	};

	canLateJoin: boolean = true;
	categoryAbbreviations: Dict<string> = {hp: 'HP', atk: 'Atk', def: 'Def', spa: 'SpA', spd: 'SpD', spe: 'Spe', bst: 'BST'};
	categoryNames: Dict<string> = {hp: 'HP', atk: 'Attack', def: 'Defense', spa: 'Special Attack', spd: 'Special Defense', spe: 'Speed',
		bst: 'Base Stat Total',
	};
	categoryMaxDetails: Dict<number> = {hp: 255, atk: 190, def: 250, spa: 194, spd: 250, spe: 200, bst: 780};
	categoryMinDetails: Dict<number> = {hp: 1, atk: 5, def: 5, spa: 10, spd: 20, spe: 5, bst: 175};
	closeCalls = new Map<Player, number>();
	closeOrFar: 'close' | 'far' = 'close';
	detailCategories: string[] = ['hp', 'atk', 'def', 'spa', 'spd', 'spe', 'bst'];

	getCardDetail(card: IPokemonCard, detail: string): number {
		if (detail === 'bst') {
			let bst = 0;
			for (const i in card.baseStats) {
				// @ts-expect-error
				bst += card.baseStats[i];
			}
			return bst;
		} else {
			// @ts-expect-error
			return card.baseStats[detail] as number;
		}
	}

	awardCardChieve(hands: {player: Player; detail: number; card: ICard}[]): void {
		for (const hand of hands) {
			const closeCalls = this.closeCalls.get(hand.player) || 0;
			if (Math.abs(this.targetDetail - hand.detail) === 1) {
				this.closeCalls.set(hand.player, closeCalls + 1);
				if ((closeCalls + 1) === 3) this.unlockAchievement(hand.player, CradilysCloseupCards.achievements.closecaller);
			}
		}
	}
}

export const game: IGameFile<CradilysCloseupCards> = Games.copyTemplateProperties(cardGame, {
	aliases: ["cradilys", "closeupcards", "cccards"],
	commandDescriptions: [Config.commandCharacter + "play [Pokemon]"],
	class: CradilysCloseupCards,
	description: "Players try to play the Pokemon card closest to the randomly chosen category each round!",
	name: "Cradily's Closeup Cards",
	mascot: "Cradily",
	scriptedOnly: true,
	variants: [
		{
			name: "Inverse Cradily's Closeup Cards",
			description: "Players try to play the Pokemon card farthest from the randomly chosen category each round!",
			closeOrFar: 'far',
			variantAliases: ["inverse"],
		},
	],
});
