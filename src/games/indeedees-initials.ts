import { assert } from "../test/test-tools";
import type { GameFileTests, IGameCachedData, IGameFile } from "../types/games";
import { game as questionAndAnswerGame, QuestionAndAnswer } from './templates/question-and-answer';

function getInitials(word: string): string | null {
    if (/\d/.test(word)) return '';

    let initials = "";
    for (let i = 0; i < word.length; i++) {
        if (/[A-Z]/.test(word.charAt(i))) initials += word.charAt(i);
        if (i && /[a-z]/.test(word.charAt(i)) && !/[A-Za-z]/.test(word.charAt(i - 1))) initials += word.charAt(i);
    }
    if (initials.length < 2) return '';
    return initials;
}

class IndeedeesInitials extends QuestionAndAnswer {
    static cachedData: IGameCachedData = {};

    // eslint-disable-next-line @typescript-eslint/require-await
    static async loadData(): Promise<void> {
        this.cachedData.categories = ["Locations", "Pokemon", "Pokemon Abilities", "Pokemon Items", "Pokemon Moves"];
        const categoryHintKeys: Dict<string[]> = {
            "Locations": [],
            "Pokemon": [],
            "Pokemon Abilities": [],
            "Pokemon Items": [],
            "Pokemon Moves": [],
        };
        const categoryHints: Dict<Dict<string[]>> = {
            "Locations": {},
            "Pokemon": {},
            "Pokemon Abilities": {},
            "Pokemon Items": {},
            "Pokemon Moves": {},
        };

        for (const location of Dex.getLocations()) {
            const initials = getInitials(location);
            if (!initials) continue;
            if (!(initials in categoryHints.Locations)) {
                categoryHintKeys.Locations.push(initials);
                categoryHints.Locations[initials] = [];
            }
            categoryHints.Locations[initials].push(location);
        }

        for (const pokemon of Games.getPokemonList()) {
            const initials = getInitials(pokemon.name);
            if (!initials) continue;
            if (!(initials in categoryHints.Pokemon)) {
                categoryHintKeys.Pokemon.push(initials);
                categoryHints.Pokemon[initials] = [];
            }
            categoryHints.Pokemon[initials].push(pokemon.name);
        }

        for (const ability of Games.getAbilitiesList()) {
            const initials = getInitials(ability.name);
            if (!initials) continue;
            if (!(initials in categoryHints["Pokemon Abilities"])) {
                categoryHintKeys["Pokemon Abilities"].push(initials);
                categoryHints["Pokemon Abilities"][initials] = [];
            }
            categoryHints["Pokemon Abilities"][initials].push(ability.name);
        }

        for (const item of Games.getItemsList()) {
            const initials = getInitials(item.name);
            if (!initials) continue;
            if (!(initials in categoryHints["Pokemon Items"])) {
                categoryHintKeys["Pokemon Items"].push(initials);
                categoryHints["Pokemon Items"][initials] = [];
            }
            categoryHints["Pokemon Items"][initials].push(item.name);
        }

        for (const move of Games.getMovesList()) {
            const initials = getInitials(move.name);
            if (!initials) continue;
            if (!(initials in categoryHints["Pokemon Moves"])) {
                categoryHintKeys["Pokemon Moves"].push(initials);
                categoryHints["Pokemon Moves"][initials] = [];
            }
            categoryHints["Pokemon Moves"][initials].push(move.name);
        }

        this.cachedData.categoryHintKeys = categoryHintKeys;
        this.cachedData.categoryHintAnswers = categoryHints;
    }
}

const tests: GameFileTests<IndeedeesInitials> = {
    'should handle lowercase letters': {
        test(): void {
            assert(IndeedeesInitials.cachedData.categoryHintKeys!["Pokemon Abilities"].includes("BoR"));
        },
    },
};

export const game: IGameFile<IndeedeesInitials> = Games.copyTemplateProperties(questionAndAnswerGame, {
    aliases: ['indeedees', 'initials', 'ii'],
    category: 'identification-1',
    class: IndeedeesInitials,
    defaultOptions: ['points'],
    description: "Players guess answers that have the given initials!",
    freejoin: true,
    name: "Indeedee's Initials",
    mascot: "Indeedee",
    minigameCommand: 'initial',
    minigameDescription: "Use <code>" + Config.commandCharacter + "g</code> to guess an answer with the given initials!",
    modes: ["abridged", "collectiveteam", "multianswer", "pmtimeattack", "prolix", "spotlightteam", "survival", "timeattack"],
    tests: Object.assign({}, questionAndAnswerGame.tests, tests),
    variants: [
        {
            name: "Indeedee's Ability Initials",
            roundCategory: "Pokemon Abilities",
            variantAliases: ['ability', 'abilities', 'pokemon abilities'],
        },
        {
            name: "Indeedee's Item Initials",
            roundCategory: "Pokemon Items",
            variantAliases: ['item', 'items', 'pokemon items'],
        },
        {
            name: "Indeedee's Location Initials",
            roundCategory: "Locations",
            variantAliases: ['location', 'locations'],
        },
        {
            name: "Indeedee's Move Initials",
            roundCategory: "Pokemon Moves",
            variantAliases: ['move', 'moves', 'pokemon moves'],
        },
        {
            name: "Indeedee's Pokemon Initials",
            roundCategory: "Pokemon",
            variantAliases: ['pokemon'],
        },
    ],
});
