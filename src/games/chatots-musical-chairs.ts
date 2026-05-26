import type { Player } from "../room-activity";
import { ScriptedGame } from "../room-game-scripted";
import type { GameCommandDefinitions, IGameAchievement, IGameFile } from "../types/games";

type AchievementNames = "panicatthechair" | "speedysitter";

class ChatotsMusicalChairs extends ScriptedGame {
	static achievements: KeyedDict<AchievementNames, IGameAchievement> = {
		"panicatthechair": {name: "Panic! at the Chair", type: 'special', bits: 1000, description: "sit in the last available chair after missing at least 2 others"},
		"speedysitter": {name: "Speedy Sitter", type: 'first', bits: 1000, description: "sit first every round"},
	}

	firstSit: Player | undefined;
	roundActions = new Map<Player, number>();
	roundChairs: number = 0;
	roundTimes: number[] = [5000, 5500, 6000, 6500, 7000];
	sitAttempts = new Map<Player, number>();
	speedySitter: Player | false | undefined;

	stopMusic(): void {
		if (this.getRemainingPlayerCount() < 2) return this.end();

		for (const i in this.players) {
			if (this.players[i].eliminated) continue;

			const player = this.players[i];
			if (!this.roundActions.has(player)) {
				player.sayPrivateHtml("You did not sit in a chair in time!");
				this.eliminatePlayer(player);
			}

			if (player === this.firstSit) {
				if (this.speedySitter === undefined) {
					this.speedySitter = player;
				} else {
					if (this.speedySitter && this.speedySitter !== player) this.speedySitter = false;
				}
			}
		}

		void this.nextRound();
	}

	// eslint-disable-next-line @typescript-eslint/require-await
	async onNextRound(): Promise<void> {
		this.firstSit = undefined;
		for (const i in this.players) {
			if (this.players[i].eliminated) continue;

			this.sitAttempts.set(this.players[i], 0);
		}

		this.roundChairs = 0;

		const len = this.getRemainingPlayerCount();
		if (len <= 1) {
			this.end();
			return;
		}

		this.roundActions.clear();

		const html = this.getRoundHtml(players => this.getPlayerNames(players));
		const uhtmlName = this.uhtmlBaseName + '-round-html';
		this.onUhtml(uhtmlName, html, () => {
			const roundChairs = this.getRemainingPlayerCount() - 1;
			const startText = "The music has started! There " + (roundChairs === 1 ? "is **1 chair**" :
				"are **" + roundChairs + " chairs**") + " remaining.";
			this.on(startText, () => {
				this.setTimeout(() => {
					const stopText = "**The music stopped!**";
					this.on(stopText, () => {
						this.roundChairs = roundChairs;
					});
					this.say(stopText);

					this.setTimeout(() => this.stopMusic(), 5 * 1000);
				}, this.sampleOne(this.roundTimes));
			});

			this.setTimeout(() => this.say(startText), 5 * 1000);
		});
		this.sayUhtml(uhtmlName, html);
	}

	onEnd(): void {
		const winner = this.getFinalPlayer();
		if (winner) {
			this.winners.set(winner, 1);
			this.addBits(winner, 500);
			if (this.speedySitter) this.unlockAchievement(winner, ChatotsMusicalChairs.achievements.speedysitter);
		}

		this.announceWinners();
	}

	destroyPlayers(): void {
		super.destroyPlayers();

		this.roundActions.clear();
	}
}

const commands: GameCommandDefinitions<ChatotsMusicalChairs> = {
	sit: {
		command(target, room, user) {
			if (!this.roundChairs || this.roundActions.has(this.players[user.id])) return false;
			const player = this.players[user.id];
			if (this.roundActions.size === this.roundChairs) {
				player.sayPrivateHtml("All of the chairs are already taken!");
				return false;
			}

			const chair = parseInt(target);
			if (isNaN(chair) || chair < 1 || chair > this.roundChairs) {
				player.sayPrivateHtml("You can only sit in " + (this.roundChairs === 1 ? "chair #1" : " the chairs #1 through #" +
					this.roundChairs) + "!");
				return false;
			}

			let takenChair = false;
			this.roundActions.forEach(playerChair => {
				if (playerChair === chair) takenChair = true;
			});

			const attempts = this.sitAttempts.get(player);
			// eslint-disable-next-line @typescript-eslint/no-unnecessary-condition
			if (takenChair) {
				player.sayPrivateHtml("The chair #" + chair + " is already taken!");
				if (attempts || attempts === 0) this.sitAttempts.set(player, attempts + 1);
				return false;
			}

			if (!this.roundActions.size) this.firstSit = player;
			this.roundActions.set(player, chair);
			if (this.roundActions.size === this.roundChairs && attempts && attempts > 1) this.unlockAchievement(player, ChatotsMusicalChairs.achievements.panicatthechair);

			return true;
		},
	},
};

export const game: IGameFile<ChatotsMusicalChairs> = {
	aliases: ["chatots", "cmc", "musicalchairs"],
	category: 'reaction',
	challengeSettings: {
		onevsone: {
			enabled: true,
		},
	},
	commandDescriptions: [Config.commandCharacter + "sit [chair]"],
	commands,
	class: ChatotsMusicalChairs,
	description: "Players try to be the first to sit in an open chair each round when the music stops!",
	name: "Chatot's Musical Chairs",
	mascot: "Chatot",
};
