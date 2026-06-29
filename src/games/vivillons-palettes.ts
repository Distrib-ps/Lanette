import type { IGameFile } from "../types/games";
import { game as questionAndAnswerGame, QuestionAndAnswer } from './templates/question-and-answer';

const MIN_POKEMON = 6;
const MAX_POKEMON = 10;

const colors: string[] = [];
const data: Record<string, string[]> = {};

class VivillonsPalettes extends QuestionAndAnswer {
	lastSelectedColors: string[] = [];
	selectedColors: string[] = [];
	selectedPokemon: string[] = [];
	selectedPokemonLength: number = 0;

	// eslint-disable-next-line @typescript-eslint/require-await
	static async loadData(): Promise<void> {
		for (const pokemon of Games.getPokemonList()) {
			// eslint-disable-next-line @typescript-eslint/no-unnecessary-condition
			if (!data[pokemon.color]) {
				data[pokemon.color] = [];
				colors.push(pokemon.color);
			}
			data[pokemon.color].push(pokemon.name);
		}
	}

	validateSelectedColors() {
		return this.lastSelectedColors.join() !== this.selectedColors.join();
	}

	getAnswers(): string[] {
		return [this.answers[0]];
	}

	checkAnswer(guess: string): string {
		guess = Tools.toId(guess);
		for (const answer of this.answers) {
			if (Tools.toId(answer) === guess) return this.answers[0];
		}
		return "";
	}

	async customGenerateHint(): Promise<void> {
		this.selectedPokemon = [];
		this.selectedColors = this.shuffle(colors).splice(0, 3).sort();
		if (!this.validateSelectedColors()) {
			return await this.customGenerateHint();
		}
		const pokemonLists: string[][] = [];
		this.selectedPokemonLength = MIN_POKEMON + this.random((1 + MAX_POKEMON) - MIN_POKEMON);

		for (const color of this.selectedColors) {
			pokemonLists.push(this.shuffle(data[color]));
			const insertedPokemon = pokemonLists[pokemonLists.length - 1].shift();
			if (insertedPokemon) this.selectedPokemon.push(insertedPokemon);
		}

		let attempts = 0;
		while (this.selectedPokemon.length < this.selectedPokemonLength && attempts < 100) {
			const insertedPokemon = this.sampleOne(pokemonLists).shift();
			if (insertedPokemon) this.selectedPokemon.push(insertedPokemon);
			attempts++;
		}

		this.selectedPokemon = this.shuffle(this.selectedPokemon);
		this.lastSelectedColors = this.selectedColors.slice();

		const pokemonIcons: string[] = [];
		for (const name of this.selectedPokemon) {
			const pokemon = Dex.getExistingPokemon(name);
			pokemonIcons.push(Dex.getPokemonIcon(pokemon) + pokemon.name);
		}

		this.answers = Tools.getPermutations(this.selectedColors).map(x => x.join(", "));
		this.hint = "<div class='infobox'>" + pokemonIcons.join(", ") + "</div>";
	}
}

export const game: IGameFile<VivillonsPalettes> = Games.copyTemplateProperties(questionAndAnswerGame, {
	aliases: ['vivillons', 'palettes', 'vp'],
	category: 'knowledge-2',
	class: VivillonsPalettes,
	defaultOptions: ['points'],
	description: "Players guess the colors shared by the given Pokemon!",
	freejoin: true,
	name: "Vivillon's Palettes",
	mascots: ['Vivillon', 'Vivillon-Archipelago', 'Vivillon-Continental', 'Vivillon-Elegant', 'Vivillon-Garden', 'Vivillon-High Plains',
		'Vivillon-Icy Snow', 'Vivillon-Jungle', 'Vivillon-Marine', 'Vivillon-Modern', 'Vivillon-Monsoon', 'Vivillon-Ocean', 'Vivillon-Polar',
		'Vivillon-River', 'Vivillon-Sandstorm', 'Vivillon-Savanna', 'Vivillon-Sun', 'Vivillon-Tundra', 'Vivillon-Fancy', 'Vivillon-Pokeball'],
	mascotPrefix: "Vivillon's",
	minigameCommand: 'palette',
	minigameDescription: "Use <code>" + Config.commandCharacter + "g</code> to guess the three colors shared by the given Pokemon!",
	modes: ["collectiveteam", "pmtimeattack", "spotlightteam", "survival", "timeattack"],
});
