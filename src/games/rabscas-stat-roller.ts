import type { IGameFile } from "../types/games";
import { game as questionAndAnswerGame, QuestionAndAnswer } from './templates/question-and-answer';

const MIN_POKEMON = 12;
const MAX_POKEMON = 18
const STATS: string[] = ["HP", "Attack", "Defense", "Special Attack", "Special Defense", "Speed", "Base Stat Total", "Weight", "Height"];
const MINMAX: string[] = ["Lowest", "Highest"];

const data: Record<string, number[]> = {};

class RabscasStatRoller extends QuestionAndAnswer {
    selectedPokemonValues: Dict<number> = {};
    max: number = 0;
    min: number = 1000;
    extremaPokemon: string[] = [];

    // eslint-disable-next-line @typescript-eslint/require-await
	static async loadData(): Promise<void> {
		for (const pokemon of Games.getPokemonList()) {
            if (pokemon.name.includes("-Gmax") || pokemon.name.includes("-Eternamax")) {
                continue;
            }
            data[pokemon.name] = [
                pokemon.baseStats.hp,
                pokemon.baseStats.atk,
                pokemon.baseStats.def,
                pokemon.baseStats.spa,
                pokemon.baseStats.spd,
                pokemon.baseStats.spe,
                pokemon.bst,
                pokemon.weightkg,
                pokemon.heightm
            ]
		}
	}

    // eslint-disable-next-line @typescript-eslint/require-await
    async customGenerateHint(): Promise<void> {
        const numPokemon = this.random(MAX_POKEMON - MIN_POKEMON + 1) + MIN_POKEMON

        const pokemonList: string[] = Object.keys(data);
		const selectedPokemon = this.sampleMany(pokemonList, numPokemon);

        const statIndex: number = this.random(9);

        this.selectedPokemonValues = {};
        this.max = 0;
        this.min = 1000;
        this.extremaPokemon = [];

        for (const pokemon of selectedPokemon) {
            this.selectedPokemonValues[pokemon] = data[pokemon][statIndex];
        }

        const extrema: number = this.random(2);
        
        if (extrema) {
            for (const pokemon in this.selectedPokemonValues) {
                if (this.selectedPokemonValues[pokemon] > this.max) {
                    this.max = this.selectedPokemonValues[pokemon];
                    this.extremaPokemon = [];
                    this.extremaPokemon.push(pokemon);
                } else if (this.selectedPokemonValues[pokemon] === this.max) {
                    this.extremaPokemon.push(pokemon);
                }
            }
        } else {
            for (const pokemon in this.selectedPokemonValues) {
                if (this.selectedPokemonValues[pokemon] < this.min) {
                    this.min = this.selectedPokemonValues[pokemon];
                    this.extremaPokemon = [];
                    this.extremaPokemon.push(pokemon);
                } else if (this.selectedPokemonValues[pokemon] === this.min) {
                    this.extremaPokemon.push(pokemon);
                }
            }
        }

		const pokemonIcons: string[] = [];
		for (const name in this.selectedPokemonValues) {
			const pokemon = Dex.getExistingPokemon(name);
			pokemonIcons.push(Dex.getPokemonIcon(pokemon) + pokemon.name);
		}

		this.answers = this.extremaPokemon;
		this.hint = "<div class='infobox'>" + pokemonIcons.join(", ") + "</div><br><center>Rabsca wants the Pokemon with the <b>" + MINMAX[extrema] + " " + STATS[statIndex] + "</b>!.</center>";
        
	}

}

export const game: IGameFile<RabscasStatRoller> = Games.copyTemplateProperties(questionAndAnswerGame, {
    aliases: ['rabscas', 'statroller', 'rsr'],
    category: 'knowledge-3',
    class: RabscasStatRoller,
    defaultOptions: ['points'],
    description: "Players identify which of the given Pokemon has the highest or lowest amount of the designated stat!",
    freejoin: true,
    name: "Rabsca's Stat Roller",
    mascot: "Rabsca",
    modes: ["collectiveteam", "pmtimeattack", "spotlightteam", "timeattack"],
});