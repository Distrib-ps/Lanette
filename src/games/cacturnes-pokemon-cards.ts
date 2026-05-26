import type { Player } from '../room-activity';
import type { IGameAchievement, IGameFile } from "../types/games";
import type { ICard, IPokemonCard } from "./templates/card";
import { CardHighLow, game as cardGame } from "./templates/card-high-low";

type AchievementNames = "flushed" | "middleoftheroad";

class CacturnesPokemonCards extends CardHighLow {
	static achievements: KeyedDict<AchievementNames, IGameAchievement> = {
		"flushed": {name: "Flushed", type: 'special', bits: 1000, description: 'reach the maximum score in 5 rounds'},
		"middleoftheroad": {name: "Middle of the Road", type: 'special', bits: 1000, description: 'win a round with a Pokemon in the NFE tier'},
	};

	canLateJoin: boolean = true;
	categoryAbbreviations: Dict<string> = {hp: 'HP', atk: 'Atk', def: 'Def', spa: 'SpA', spd: 'SpD', spe: 'Spe', bst: 'BST'};
	categoryNames: Dict<string> = {hp: 'HP', atk: 'Attack', def: 'Defense', spa: 'Special Attack', spd: 'Special Defense', spe: 'Speed',
		bst: 'Base Stat Total',
	};
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
			const pokemon = Dex.getPokemon(hand.card.name);
			if (pokemon && (pokemon.tier === "NFE" || (pokemon.prevo && pokemon.evos.length))) {
				this.unlockAchievement(hand.player, CacturnesPokemonCards.achievements.middleoftheroad);
			}
		}
	}

	awardPointsChieve(player: Player): void {
		this.unlockAchievement(player, CacturnesPokemonCards.achievements.flushed);
	}
}

export const game: IGameFile<CacturnesPokemonCards> = Games.copyTemplateProperties(cardGame, {
	aliases: ["cacturnes", "cpc"],
	commandDescriptions: [Config.commandCharacter + "play [Pokemon]"],
	class: CacturnesPokemonCards,
	description: "Players try to play the highest (or lowest) Pokemon card in the randomly chosen category each round!",
	name: "Cacturne's Pokemon Cards",
	mascot: "Cacturne",
	scriptedOnly: true,
});
