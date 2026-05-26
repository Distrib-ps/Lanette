import type { Player } from "../room-activity";
import { ScriptedGame } from "../room-game-scripted";
import type { GameCommandDefinitions, IGameAchievement, IGameFile } from "../types/games";

type AchievementNames = "lightningstrike" | "prolixprodigy";

interface IRoundAbility {
	name: string;
	points: number;
}

const data: {abilities: string[]} = {
	abilities: [],
};

class DedennesAbilityBlitz extends ScriptedGame {
	static achievements: KeyedDict<AchievementNames, IGameAchievement> = {
		"lightningstrike": {name: "Lightning Strike", type: 'first', bits: 1000, description: "answer first every round and win"},
		"prolixprodigy": {name: "Prolix Prodigy", type: 'special', bits: 1000, description: "answer with the longest answer every round"},
	}

	canSelect: boolean = false;
	firstType: Player | null = null;
	inactiveRoundLimit: number = 5;
	lightningStrike: Player | false | undefined;
	longestAbilities: string[] = [];
	maxPoints: number = 1000;
	points = new Map<Player, number>();
	prolixProdigies: Player[] | undefined;
	revealTime: number = 5 * 1000;
	roundAbilities = new Map<string, IRoundAbility>();
	roundLimit: number = 20;
	roundSelections = new Map<Player, IRoundAbility>();
	roundTime: number = 3 * 1000;

	// eslint-disable-next-line @typescript-eslint/require-await
	static async loadData(): Promise<void> {
		data.abilities = Games.getAbilitiesList().map(x => x.name);
	}

	// eslint-disable-next-line @typescript-eslint/require-await
	async onSignups(): Promise<void> {
		if (this.options.freejoin) this.setTimeout(() => void this.nextRound(), 5000);
	}

	generateAbilities(): void {
		this.longestAbilities = [];
		const abilities = this.sampleMany(data.abilities, 3);
		for (const ability of abilities) {
			const id = Tools.toId(ability);
			this.roundAbilities.set(id, {name: ability, points: id.length * 10});
			if (!this.longestAbilities.length) {
				this.longestAbilities.push(id);
			} else {
				const longestAbilityLength = this.longestAbilities[0].length;
				if (id.length >= longestAbilityLength) {
					if (id.length > longestAbilityLength) this.longestAbilities = [];
					this.longestAbilities.push(id);
				}
			}
		}
		const text = "Randomly generated abilities: **" + abilities.join(", ") + "**!";
		this.on(text, () => {
			this.canSelect = true;
			this.setTimeout(() => void this.nextRound(), this.getRoundTime());
		});
		this.say(text);
	}

	// eslint-disable-next-line @typescript-eslint/require-await
	async onNextRound(): Promise<void> {
		this.canSelect = false;
		const prolixProdigies: Player[] = [];
		if (this.round > 1) {
			let highestPoints = 0;
			if (this.roundSelections.size) {
				if (this.inactiveRounds) this.inactiveRounds = 0;

				const selections: {player: Player; ability: string; points: number}[] = [];
				let firstAnswer = true;
				this.roundSelections.forEach((ability, player) => {
					if (player.eliminated) return;
					selections.push({player, ability: ability.name, points: ability.points});

					if (firstAnswer) {
						if (this.lightningStrike === undefined) {
							this.lightningStrike = player;
						} else {
							if (this.lightningStrike && this.lightningStrike !== player) this.lightningStrike = false;
						}
					}
					firstAnswer = false;

					if (this.longestAbilities.includes(Tools.toId(ability.name))) prolixProdigies.push(player);
				});
				selections.sort((a, b) => b.points - a.points);
				for (let i = 0, len = selections.length; i < len; i++) {
					const player = selections[i].player;
					let points = this.points.get(player) || 0;
					points += selections[i].points;
					this.points.set(player, points);
					player.say(selections[i].ability + " was worth " + selections[i].points + " points! Your total score is now: " +
						points + ".");
					if (points > highestPoints) highestPoints = points;
					// if (catches[i].pokemon === this.highestBST) this.markFirstAction(player, 'highestCatch');
				}
			} else {
				this.inactiveRounds++;
				if (this.inactiveRounds === this.inactiveRoundLimit) {
					this.inactivityEnd();
					return;
				}
			}

			this.roundSelections.clear();
			this.roundAbilities.clear();

			if (!this.prolixProdigies) {
				this.prolixProdigies = prolixProdigies;
			} else {
				this.prolixProdigies = this.prolixProdigies.filter(x => prolixProdigies.includes(x));
			}
			
			if (highestPoints >= this.maxPoints) {
				this.setTimeout(() => this.end(), 3000);
				return;
			}
			if (this.round > this.roundLimit) {
				this.setTimeout(() => {
					this.say("We've reached the end of the game!");
					this.maxPoints = highestPoints;
					this.setTimeout(() => this.end(), 3000);
				}, 3000);
				return;
			}
		}

		const html = this.getRoundHtml(players => this.getPlayerPoints(players));
		const uhtmlName = this.uhtmlBaseName + '-round-html';
		this.onUhtml(uhtmlName, html, () => {
			this.setTimeout(() => this.generateAbilities(), this.revealTime);
		});
		this.sayUhtml(uhtmlName, html);
	}

	onEnd(): void {
		for (const i in this.players) {
			if (this.players[i].eliminated) continue;
			const player = this.players[i];
			const points = this.points.get(player);
			if (points && points >= this.maxPoints) this.winners.set(player, points);
			if (player === this.lightningStrike) this.unlockAchievement(player, DedennesAbilityBlitz.achievements.lightningstrike);
			if (this.prolixProdigies?.includes(player)) this.unlockAchievement(player, DedennesAbilityBlitz.achievements.prolixprodigy);
		}
		this.convertPointsToBits(0.5, 0.1);
		this.announceWinners();
	}

	destroyPlayers(): void {
		super.destroyPlayers();

		this.roundSelections.clear();
	}
}

const commands: GameCommandDefinitions<DedennesAbilityBlitz> = {
	select: {
		command(target, room, user) {
			if (!this.canSelect) return false;
			const player = this.createPlayer(user) || this.players[user.id];
			if (this.roundSelections.has(player)) return false;
			target = Tools.toId(target);
			if (!target) return false;
			const ability = this.roundAbilities.get(target);
			if (!ability) return false;
			this.roundSelections.set(player, ability);
			this.roundAbilities.delete(target);
			return true;
		},
	},
};

export const game: IGameFile<DedennesAbilityBlitz> = {
	aliases: ["dedennes", "dab"],
	category: 'speed',
	challengeSettings: {
		onevsone: {
			enabled: true,
			options: ['speed'],
		},
	},
	commandDescriptions: [Config.commandCharacter + "select [ability]"],
	commands,
	class: DedennesAbilityBlitz,
	description: "Players try to type one of the shown abilities before anyone else within the three second timer! Abilities containing " +
		"more letters award more points.",
	freejoin: true,
	name: "Dedenne's Ability Blitz",
	mascot: "Dedenne",
};
