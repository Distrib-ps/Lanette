import type { Player } from "../room-activity";
import { ScriptedGame } from "../room-game-scripted";
import type { GameCommandDefinitions, IGameFile } from "../types/games";

const CUT_COMMAND = "cut";

class MagnezonesMalfunctions extends ScriptedGame {
    badWire: number = 0;
	canCut: boolean = false;
    hasAssistActions: boolean = true;
    minPlayers: number = 4;
    order: Player[] = [];
    playerList: Player[] = [];
    wires: number[] = [];

    onRemovePlayer(): void {
        if (!this.started) return;
        this.currentPlayer = null;
        void this.nextRound();
    }

    // eslint-disable-next-line @typescript-eslint/require-await
    async onNextRound(): Promise<void> {
        if (this.currentPlayer) {
            this.say("**" + this.currentPlayer.name + "** did not cut a wire and has been eliminated from the game! The wires " +
                "will now reset.");
            this.eliminatePlayer(this.currentPlayer);
            this.currentPlayer = null;
        }

        const remainingPlayerCount = this.getRemainingPlayerCount();
        if (remainingPlayerCount === 1) {
            this.setTimeout(() => this.end(), 5 * 1000);
            return;
        } else if (remainingPlayerCount <= 0) {
            this.say("The game has ended due to a lack of players.");
            this.end();
            return;
        }

        this.order = this.shufflePlayers(this.getRemainingPlayers());
        this.playerList = this.order.slice();
        this.currentPlayer = this.playerList[0];
        this.playerList.shift();

        const html = this.getRoundHtml(players => this.getPlayerNames(players));
        const uhtmlName = this.uhtmlBaseName + '-round-html';
        this.onUhtml(uhtmlName, html, () => {
            this.setTimeout(() => {
                this.wires = [];
                this.badWire = this.random(this.getRemainingPlayerCount()) + 1;
                for (let i = 1; i <= this.getRemainingPlayerCount(); i++) {
                    this.wires.push(i);
                }
                this.chooseNextPlayer();
            }, 5000);
        });
        this.sayUhtml(uhtmlName, html);
        this.say("The wires have been shuffled!");
    }

    chooseNextPlayer(): void {
        if (!this.getRemainingPlayerCount()) {
            void this.nextRound();
            return;
        }

        this.currentPlayer = null;

        if (!this.playerList.length) this.playerList = this.order.slice();
        let currentPlayer = this.playerList[0];
        this.playerList.shift();
        while (currentPlayer.eliminated) {
            if (!this.playerList.length) this.playerList = this.order.slice();
            currentPlayer = this.playerList[0];
            this.playerList.shift();
        }

        if (this.wires.length === 1) {
            this.say("**" + currentPlayer.name + "** was forced to cut the last wire! " + this.mascot!.name + " exploded " +
                "and eliminated " + currentPlayer.name + "!");
            this.eliminatePlayer(currentPlayer);
            this.setTimeout(() => void this.nextRound(), 5 * 1000);
            return;
        }

        const text = "**" + currentPlayer.name + "**, you are up! Cut a wire! (" + this.wires.join(", ") + ")"; 
        this.on(text, () => {
            this.currentPlayer = currentPlayer;
            this.setTimeout(() => void this.nextRound(), 30 * 1000);
        });
        this.say(text);
        this.canCut = true;

        const buttons: string[] = [];
        for (const wire of this.wires) {
            buttons.push(this.getMsgRoomButton(CUT_COMMAND + " " + wire, "Cut <b>Wire " + wire + "</b>", false, currentPlayer));
        }

        this.sendPlayerAssistActions(currentPlayer, this.getCustomButtonsDiv(buttons, currentPlayer), this.actionsUhtmlName);
    }

    onEnd(): void {
        const remainingPlayers = Object.keys(this.getRemainingPlayers());
        if (remainingPlayers.length <= 1) {
            for (let i = 0; i < 2; i++) {
                if (!remainingPlayers[i]) break;
                this.winners.set(this.players[remainingPlayers[i]], 1);
                this.addBits(this.players[remainingPlayers[i]], 250);
            }
        }
        this.announceWinners();
    }
}

const commands: GameCommandDefinitions<MagnezonesMalfunctions> = {
    [CUT_COMMAND]: {
        command(target, room, user) {
            if (this.players[user.id] !== this.currentPlayer) return false;
            const player = this.players[user.id];
            const cutIndex = this.wires.indexOf(parseInt(target));
            if (cutIndex < 0) return false;

            if (this.timeout) clearTimeout(this.timeout);

            this.clearPlayerAssistActions(player, this.actionsUhtmlName);

            if (parseInt(target) === this.badWire) {
                this.say("**" + this.currentPlayer.name + "** cut the wrong wire! " + this.mascot!.name + " exploded and eliminated " +
                    this.currentPlayer.name + "!");
                this.eliminatePlayer(this.currentPlayer);
                this.currentPlayer = null;
		        this.setTimeout(() => void this.nextRound(), 5 * 1000);
            } else {
                this.say("**" + this.currentPlayer.name + "** is safe!");
                this.wires.splice(cutIndex, 1);
		        this.setTimeout(() => this.chooseNextPlayer(), 5 * 1000);
            }
            this.canCut = false;
            return true;
        },
    },
};

export const game: IGameFile<MagnezonesMalfunctions> = {
    aliases: ['magnezones', 'malfunctions'],
    category: 'luck',
    class: MagnezonesMalfunctions,
    commandDescriptions: [Config.commandCharacter + CUT_COMMAND + " [wire number]"],
    commands,
    description: "Players cut wires to help the malfunctioning Magnezone! However, cutting the wrong wire will result in elimination!",
    name: "Magnezone's Malfunctions",
    mascot: "Magnezone",
    scriptedOnly: true,
};
