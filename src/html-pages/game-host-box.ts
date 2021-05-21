import type { Room } from "../rooms";
import type { BaseCommandDefinitions } from "../types/command-parser";
import type { TrainerSpriteId } from "../types/dex";
import type { IDatabase, IGameCustomBorder, IGameHostBox } from "../types/storage";
import type { BorderType, HexCode } from "../types/tools";
import type { User } from "../users";
import { BorderStyle } from "./components/border-style";
import type { IColorPick } from "./components/color-picker";
import { ColorPicker } from "./components/color-picker";
import { PokemonModelPicker } from "./components/pokemon-model-picker";
import type { IPokemonPick } from "./components/pokemon-picker-base";
import type { ITrainerPick } from "./components/trainer-picker";
import { TrainerPicker } from "./components/trainer-picker";
import type { PokemonChoices } from "./game-host-control-panel";
import { HtmlPageBase } from "./html-page-base";

type BorderPickers = 'background' | 'buttons';
type BorderDatabaseKeys = 'backgroundBorder' | 'buttonsBorder';

const baseCommand = 'gamehostbox';
const chooseBackgroundColorPicker = 'choosebackgroundcolorpicker';
const chooseButtonColorPicker = 'choosebuttoncolorpicker';
const chooseSignupsBackgroundColorPicker = 'choosesignupsbackgroundcolorpicker';
const chooseSignupsButtonColorPicker = 'choosesignupsbuttoncolorpicker';
const chooseBackgroundBorderPicker = 'choosebackgroundborderpicker';
const chooseButtonsBorderPicker = 'choosebuttonsborderpicker';
const chooseTrainerPicker = 'choosetrainerpicker';
const choosePokemonModelPicker = 'choosepokemonmodelpicker';
const setBackgroundColorCommand = 'setbackgroundcolor';
const setButtonColorCommand = 'setbuttonscolor';
const setSignupsBackgroundColorCommand = 'setsignupsbackgroundcolor';
const setSignupsButtonColorCommand = 'setsignupsbuttonscolor';
const setBackgroudBorderStyleCommand = 'setbackgroundborderstyle';
const setButtonBorderStyleCommand = 'setbuttonborderstyle';
const setTrainerCommand = 'settrainer';
const setPokemonModelCommand = 'setpokemonmodel';
const closeCommand = 'close';

const pages: Dict<GameHostBox> = {};

class GameHostBox extends HtmlPageBase {
	pageId = 'game-host-box';

	currentPicker: 'background' | 'buttons' | 'signups-background' | 'signups-buttons' | 'background-border' | 'buttons-border' |
		'trainer' | 'pokemon' = 'background';
	currentPokemon: PokemonChoices = [];

	backgroundColorPicker: ColorPicker;
	buttonColorPicker: ColorPicker;
	signupsBackgroundColorPicker: ColorPicker;
	signupsButtonColorPicker: ColorPicker;
	backgroundBorderStyle: BorderStyle;
	buttonsBorderStyle: BorderStyle;
	trainerPicker: TrainerPicker;
	pokemonModelPicker: PokemonModelPicker;
	maxPokemonModels: number;

	constructor(room: Room, user: User) {
		super(room, user, baseCommand);

		const database = Storage.getDatabase(this.room);
		let currentBackgroundColor: HexCode | undefined;
		let currentButtonColor: HexCode | undefined;
		let currentSignupsBackgroundColor: HexCode | undefined;
		let currentSignupsButtonColor: HexCode | undefined;
		let currentTrainer: TrainerSpriteId | undefined;
		let currentPokemon: PokemonChoices | undefined;
		let currentBackgroundBorder: IGameCustomBorder | undefined;
		let currentButtonsBorder: IGameCustomBorder | undefined;

		if (database.gameHostBoxes && this.userId in database.gameHostBoxes) {
			const box = database.gameHostBoxes[this.userId];
			currentBackgroundColor = box.background;
			currentButtonColor = box.buttons;
			currentSignupsBackgroundColor = box.signupsBackground;
			currentSignupsButtonColor = box.signupsButtons;
			currentTrainer = box.avatar;
			currentPokemon = box.pokemon;
			currentBackgroundBorder = box.backgroundBorder;
			currentButtonsBorder = box.buttonsBorder;
		}

		this.backgroundColorPicker = new ColorPicker(room, this.commandPrefix, setBackgroundColorCommand, {
			currentPick: currentBackgroundColor,
			onPickHueVariation: (index, hueVariation, dontRender) => this.pickBackgroundHueVariation(dontRender),
			onPickLightness: (index, lightness, dontRender) => this.pickBackgroundLightness(dontRender),
			onClear: (index, dontRender) => this.clearBackgroundColor(dontRender),
			onPick: (index, color, dontRender) => this.setBackgroundColor(color, dontRender),
			reRender: () => this.send(),
		});

		this.buttonColorPicker = new ColorPicker(room, this.commandPrefix, setButtonColorCommand, {
			currentPick: currentButtonColor,
			onPickHueVariation: (index, hueVariation, dontRender) => this.pickButtonHueVariation(dontRender),
			onPickLightness: (index, lightness, dontRender) => this.pickButtonLightness(dontRender),
			onClear: (index, dontRender) => this.clearButtonsColor(dontRender),
			onPick: (index, color, dontRender) => this.setButtonsColor(color, dontRender),
			reRender: () => this.send(),
		});

		this.signupsBackgroundColorPicker = new ColorPicker(room, this.commandPrefix, setSignupsBackgroundColorCommand, {
			currentPick: currentSignupsBackgroundColor,
			onPickHueVariation: (index, hueVariation, dontRender) => this.pickBackgroundHueVariation(dontRender),
			onPickLightness: (index, lightness, dontRender) => this.pickBackgroundLightness(dontRender),
			onClear: (index, dontRender) => this.clearSignupsBackgroundColor(dontRender),
			onPick: (index, color, dontRender) => this.setSignupsBackgroundColor(color, dontRender),
			reRender: () => this.send(),
		});

		this.signupsButtonColorPicker = new ColorPicker(room, this.commandPrefix, setSignupsButtonColorCommand, {
			currentPick: currentSignupsButtonColor,
			onPickHueVariation: (index, hueVariation, dontRender) => this.pickButtonHueVariation(dontRender),
			onPickLightness: (index, lightness, dontRender) => this.pickButtonLightness(dontRender),
			onClear: (index, dontRender) => this.clearSignupsButtonsColor(dontRender),
			onPick: (index, color, dontRender) => this.setSignupsButtonsColor(color, dontRender),
			reRender: () => this.send(),
		});

		this.backgroundBorderStyle = new BorderStyle(room, this.commandPrefix, setBackgroudBorderStyleCommand, {
			currentBorder: currentBackgroundBorder,
			minRadius: 2,
			maxRadius: 100,
			minSize: 2,
			maxSize: 5,
			onClearColor: (dontRender) => this.clearBorderColor('background', dontRender),
			onPickColor: (color: IColorPick, dontRender: boolean | undefined) => this.setBorderColor('background', color, dontRender),
			onClearRadius: () => this.clearBorderRadius('background'),
			onPickRadius: (radius) => this.setBorderRadius('background', radius),
			onClearSize: () => this.clearBorderSize('background'),
			onPickSize: (size) => this.setBorderSize('background', size),
			onClearType: () => this.clearBorderType('background'),
			onPickType: (type) => this.setBorderType('background', type),
			reRender: () => this.send(),
		});

		this.buttonsBorderStyle = new BorderStyle(room, this.commandPrefix, setButtonBorderStyleCommand, {
			currentBorder: currentButtonsBorder,
			minRadius: 2,
			maxRadius: 50,
			minSize: 2,
			maxSize: 5,
			onClearColor: (dontRender) => this.clearBorderColor('buttons', dontRender),
			onPickColor: (color: IColorPick, dontRender: boolean | undefined) => this.setBorderColor('buttons', color, dontRender),
			onClearRadius: () => this.clearBorderRadius('buttons'),
			onPickRadius: (radius) => this.setBorderRadius('buttons', radius),
			onClearSize: () => this.clearBorderSize('buttons'),
			onPickSize: (size) => this.setBorderSize('buttons', size),
			onClearType: () => this.clearBorderType('buttons'),
			onPickType: (type) => this.setBorderType('buttons', type),
			reRender: () => this.send(),
		});

		this.trainerPicker = new TrainerPicker(room, this.commandPrefix, setTrainerCommand, {
			currentPick: currentTrainer,
			onSetTrainerGen: (index, trainerGen, dontRender) => this.setTrainerGen(dontRender),
			onClear: (index, dontRender) => this.clearTrainer(dontRender),
			onPick: (index, trainer, dontRender) => this.selectTrainer(trainer, dontRender),
			reRender: () => this.send(),
		});

		let maxPokemon = 0;
		if (user.hasRank(this.room, 'voice')) {
			maxPokemon = 3;
		} else {
			const annualBits = Storage.getAnnualPoints(this.room, Storage.gameLeaderboard, user.name);
			if (annualBits >= Config.gameHostBoxRequirements![this.room.id].pokemon.three) {
				maxPokemon = 3;
			} else if (annualBits >= Config.gameHostBoxRequirements![this.room.id].pokemon.two) {
				maxPokemon = 2;
			} else if (annualBits >= Config.gameHostBoxRequirements![this.room.id].pokemon.one) {
				maxPokemon = 1;
			}
		}

		this.maxPokemonModels = maxPokemon;

		this.pokemonModelPicker = new PokemonModelPicker(room, this.commandPrefix, setPokemonModelCommand, {
			maxPokemon,
			clearAllPokemon: () => this.clearAllPokemon(),
			submitAllPokemon: (pokemon) => this.submitAllPokemon(pokemon),
			clearPokemon: (index, dontRender) => this.clearPokemon(index, dontRender),
			selectPokemon: (index, pokemon, dontRender) => this.selectPokemon(index, pokemon, dontRender),
			reRender: () => this.send(),
		});

		this.toggleActivePicker();

		if (currentPokemon && currentPokemon.length) {
			if (currentPokemon.length > maxPokemon) currentPokemon = currentPokemon.slice(0, maxPokemon);
			this.pokemonModelPicker.parentSubmitAllPokemonInput(currentPokemon);
		}

		this.components = [this.backgroundColorPicker, this.buttonColorPicker, this.signupsBackgroundColorPicker,
			this.signupsButtonColorPicker, this.backgroundBorderStyle, this.buttonsBorderStyle, this.trainerPicker,
			this.pokemonModelPicker];

		pages[this.userId] = this;
	}

	onClose(): void {
		delete pages[this.userId];
	}

	getDatabase(): IDatabase {
		const database = Storage.getDatabase(this.room);
		Storage.createGameHostBox(database, this.userId);

		return database;
	}

	toggleActivePicker(): void {
		this.backgroundColorPicker.active = this.currentPicker === 'background';
		this.buttonColorPicker.active = this.currentPicker === 'buttons';
		this.signupsBackgroundColorPicker.active = this.currentPicker === 'signups-background';
		this.signupsButtonColorPicker.active = this.currentPicker === 'signups-buttons';
		this.backgroundBorderStyle.active = this.currentPicker === 'background-border';
		this.buttonsBorderStyle.active = this.currentPicker === 'buttons-border';
		this.trainerPicker.active = this.currentPicker === 'trainer';
		this.pokemonModelPicker.active = this.currentPicker === 'pokemon';
	}

	chooseBackgroundColorPicker(): void {
		if (this.currentPicker === 'background') return;

		this.currentPicker = 'background';
		this.toggleActivePicker();

		this.send();
	}

	chooseButtonColorPicker(): void {
		if (this.currentPicker === 'buttons') return;

		this.currentPicker = 'buttons';
		this.toggleActivePicker();

		this.send();
	}

	chooseSignupsBackgroundColorPicker(): void {
		if (this.currentPicker === 'signups-background') return;

		this.currentPicker = 'signups-background';
		this.toggleActivePicker();

		this.send();
	}

	chooseSignupsButtonColorPicker(): void {
		if (this.currentPicker === 'signups-buttons') return;

		this.currentPicker = 'signups-buttons';
		this.toggleActivePicker();

		this.send();
	}

	chooseBackgroundBorderPicker(): void {
		if (this.currentPicker === 'background-border') return;

		this.currentPicker = 'background-border';
		this.toggleActivePicker();

		this.send();
	}

	chooseButtonsBorderPicker(): void {
		if (this.currentPicker === 'buttons-border') return;

		this.currentPicker = 'buttons-border';
		this.toggleActivePicker();

		this.send();
	}

	chooseTrainerPicker(): void {
		if (this.currentPicker === 'trainer') return;

		this.currentPicker = 'trainer';
		this.toggleActivePicker();

		this.send();
	}

	choosePokemonModelPicker(): void {
		if (this.currentPicker === 'pokemon') return;

		this.currentPicker = 'pokemon';
		this.toggleActivePicker();

		this.send();
	}

	setTrainerGen(dontRender?: boolean): void {
		if (!dontRender) this.send();
	}

	clearTrainer(dontRender?: boolean): void {
		const database = this.getDatabase();

		delete database.gameHostBoxes![this.userId].avatar;

		if (!dontRender) this.send();
	}

	selectTrainer(trainer: ITrainerPick, dontRender?: boolean): void {
		const database = this.getDatabase();

		database.gameHostBoxes![this.userId].avatar = trainer.trainer;

		if (!dontRender) this.send();
	}

	clearAllPokemon(): void {
		this.currentPokemon = [];
		this.storePokemon();

		this.send();
	}

	submitAllPokemon(pokemon: PokemonChoices): void {
		this.currentPokemon = pokemon;
		this.storePokemon();

		this.send();
	}

	clearPokemon(index: number, dontRender: boolean | undefined): void {
		this.currentPokemon[index] = undefined;

		this.storePokemon();

		if (!dontRender) this.send();
	}

	selectPokemon(index: number, pokemon: IPokemonPick, dontRender: boolean | undefined): void {
		this.currentPokemon[index] = pokemon;

		this.storePokemon();

		if (!dontRender) this.send();
	}

	storePokemon(): void {
		const database = this.getDatabase();
		database.gameHostBoxes![this.userId].pokemon = this.currentPokemon.filter(x => x !== undefined) as IPokemonPick[];
	}

	pickBackgroundHueVariation(dontRender?: boolean): void {
		if (!dontRender) this.send();
	}

	pickBackgroundLightness(dontRender?: boolean): void {
		if (!dontRender) this.send();
	}

	clearBackgroundColor(dontRender?: boolean): void {
		const database = this.getDatabase();
		delete database.gameHostBoxes![this.userId].background;

		if (!dontRender) this.send();
	}

	setBackgroundColor(color: IColorPick, dontRender?: boolean): void {
		const database = this.getDatabase();
		database.gameHostBoxes![this.userId].background = color.hexCode;

		if (!dontRender) this.send();
	}

	clearSignupsBackgroundColor(dontRender?: boolean): void {
		const database = this.getDatabase();
		delete database.gameHostBoxes![this.userId].signupsBackground;

		if (!dontRender) this.send();
	}

	setSignupsBackgroundColor(color: IColorPick, dontRender?: boolean): void {
		const database = this.getDatabase();
		database.gameHostBoxes![this.userId].signupsBackground = color.hexCode;

		if (!dontRender) this.send();
	}

	pickButtonHueVariation(dontRender?: boolean): void {
		if (!dontRender) this.send();
	}

	pickButtonLightness(dontRender?: boolean): void {
		if (!dontRender) this.send();
	}

	clearButtonsColor(dontRender?: boolean): void {
		const database = this.getDatabase();
		delete database.gameHostBoxes![this.userId].buttons;

		if (!dontRender) this.send();
	}

	setButtonsColor(color: IColorPick, dontRender?: boolean): void {
		const database = this.getDatabase();
		database.gameHostBoxes![this.userId].buttons = color.hexCode;

		if (!dontRender) this.send();
	}

	clearSignupsButtonsColor(dontRender?: boolean): void {
		const database = this.getDatabase();
		delete database.gameHostBoxes![this.userId].signupsButtons;

		if (!dontRender) this.send();
	}

	setSignupsButtonsColor(color: IColorPick, dontRender?: boolean): void {
		const database = this.getDatabase();
		database.gameHostBoxes![this.userId].signupsButtons = color.hexCode;

		if (!dontRender) this.send();
	}

	clearBorderColor(picker: BorderPickers, dontRender?: boolean): void {
		const database = this.getDatabase();

		let databaseKey: BorderDatabaseKeys;
		if (picker === 'background') {
			databaseKey = 'backgroundBorder';
		} else {
			databaseKey = 'buttonsBorder';
		}

		if (databaseKey in database.gameHostBoxes![this.userId]) {
			delete database.gameHostBoxes![this.userId][databaseKey]!.color;
		}

		if (!dontRender) this.send();
	}

	setBorderColor(picker: BorderPickers, color: IColorPick, dontRender?: boolean): void {
		const database = this.getDatabase();

		let databaseKey: BorderDatabaseKeys;
		if (picker === 'background') {
			databaseKey = 'backgroundBorder';
		} else {
			databaseKey = 'buttonsBorder';
		}

		if (!(databaseKey in database.gameHostBoxes![this.userId])) {
			database.gameHostBoxes![this.userId][databaseKey] = {};
		}
		database.gameHostBoxes![this.userId][databaseKey]!.color = color.hexCode;

		if (!dontRender) this.send();
	}

	clearBorderRadius(picker: BorderPickers): void {
		const database = this.getDatabase();

		let databaseKey: BorderDatabaseKeys;
		if (picker === 'background') {
			databaseKey = 'backgroundBorder';
		} else {
			databaseKey = 'buttonsBorder';
		}

		if (databaseKey in database.gameHostBoxes![this.userId]) {
			delete database.gameHostBoxes![this.userId][databaseKey]!.radius;
		}

		this.send();
	}

	setBorderRadius(picker: BorderPickers, radius: number): void {
		const database = this.getDatabase();

		let databaseKey: BorderDatabaseKeys;
		if (picker === 'background') {
			databaseKey = 'backgroundBorder';
		} else {
			databaseKey = 'buttonsBorder';
		}

		if (!(databaseKey in database.gameHostBoxes![this.userId])) {
			database.gameHostBoxes![this.userId][databaseKey] = {};
		}
		database.gameHostBoxes![this.userId][databaseKey]!.radius = radius;

		this.send();
	}

	clearBorderSize(picker: BorderPickers): void {
		const database = this.getDatabase();

		let databaseKey: BorderDatabaseKeys;
		if (picker === 'background') {
			databaseKey = 'backgroundBorder';
		} else {
			databaseKey = 'buttonsBorder';
		}

		if (databaseKey in database.gameHostBoxes![this.userId]) {
			delete database.gameHostBoxes![this.userId][databaseKey]!.size;
		}

		this.send();
	}

	setBorderSize(picker: BorderPickers, size: number): void {
		const database = this.getDatabase();

		let databaseKey: BorderDatabaseKeys;
		if (picker === 'background') {
			databaseKey = 'backgroundBorder';
		} else {
			databaseKey = 'buttonsBorder';
		}

		if (!(databaseKey in database.gameHostBoxes![this.userId])) {
			database.gameHostBoxes![this.userId][databaseKey] = {};
		}
		database.gameHostBoxes![this.userId][databaseKey]!.size = size;

		this.send();
	}

	clearBorderType(picker: BorderPickers): void {
		const database = this.getDatabase();

		let databaseKey: BorderDatabaseKeys;
		if (picker === 'background') {
			databaseKey = 'backgroundBorder';
		} else {
			databaseKey = 'buttonsBorder';
		}

		if (databaseKey in database.gameHostBoxes![this.userId]) {
			delete database.gameHostBoxes![this.userId][databaseKey]!.type;
		}

		this.send();
	}

	setBorderType(picker: BorderPickers, type: BorderType): void {
		const database = this.getDatabase();

		let databaseKey: BorderDatabaseKeys;
		if (picker === 'background') {
			databaseKey = 'backgroundBorder';
		} else {
			databaseKey = 'buttonsBorder';
		}

		if (!(databaseKey in database.gameHostBoxes![this.userId])) {
			database.gameHostBoxes![this.userId][databaseKey] = {};
		}
		database.gameHostBoxes![this.userId][databaseKey]!.type = type;

		this.send();
	}

	render(): string {
		let name = this.userId;
		const user = Users.get(this.userId);
		if (user) name = user.name;

		let html = "<div class='chat' style='margin-top: 4px;margin-left: 4px'><center><b>" + this.room.title + ": Game Host Box</b>";
		html += "&nbsp;" + this.getQuietPmButton(this.commandPrefix + ", " + closeCommand, "Close");

		html += "<br />";
		html += Games.getHostBoxHtml(this.room, name, name + "'s Game");
		html += "</center><br />";

		const database = Storage.getDatabase(this.room);
		let mascots: string[] = [];
		let hostBox: IGameHostBox | undefined;
		if (database.gameHostBoxes && this.userId in database.gameHostBoxes) {
			hostBox = database.gameHostBoxes[this.userId];
			mascots = hostBox.pokemon.map(x => x.pokemon);
		}

		html += Games.getSignupsPlayersHtml(hostBox,
			mascots.map(x => Dex.getPokemonIcon(Dex.getExistingPokemon(x))).join("") + "<b>" + this.userName + "'s Game - signups</b>",
			0, "");
		html += "<br />";
		html += Games.getJoinButtonHtml(hostBox, false, this.room);
		html += "<br />";

		const background = this.currentPicker === 'background';
		const buttons = this.currentPicker === 'buttons';
		const signupsBackground = this.currentPicker === 'signups-background';
		const signupsButtons = this.currentPicker === 'signups-buttons';
		const backgroundBorder = this.currentPicker === 'background-border';
		const buttonsBorder = this.currentPicker === 'buttons-border';
		const trainer = this.currentPicker === 'trainer';
		const pokemon = this.currentPicker === 'pokemon';

		html += this.getQuietPmButton(this.commandPrefix + ", " + chooseBackgroundColorPicker, "Choose background",
			background);
		html += "&nbsp;" + this.getQuietPmButton(this.commandPrefix + ", " + chooseButtonColorPicker, "Choose buttons",
			buttons);
		html += "&nbsp;" + this.getQuietPmButton(this.commandPrefix + ", " + chooseSignupsBackgroundColorPicker,
			"Choose signups background", signupsBackground);
		html += "&nbsp;" + this.getQuietPmButton(this.commandPrefix + ", " + chooseSignupsButtonColorPicker, "Choose signups buttons",
			signupsButtons);
		html += "&nbsp;" + this.getQuietPmButton(this.commandPrefix + ", " + chooseBackgroundBorderPicker, "Background border",
			backgroundBorder);
		html += "&nbsp;" + this.getQuietPmButton(this.commandPrefix + ", " + chooseButtonsBorderPicker, "Buttons border",
			buttonsBorder);
		html += "&nbsp;" + this.getQuietPmButton(this.commandPrefix + ", " + chooseTrainerPicker, "Choose trainer",
			trainer);
		html += "&nbsp;" + this.getQuietPmButton(this.commandPrefix + ", " + choosePokemonModelPicker, "Choose Pokemon",
			pokemon || !this.maxPokemonModels);
		html += "<br /><br />";

		if (background) {
			html += "<b>Background color</b><br />";
			html += this.backgroundColorPicker.render();
			html += "<br /><br />";
		} else if (buttons) {
			html += "<b>Buttons background color</b><br />";
			html += this.buttonColorPicker.render();
		} else if (signupsBackground) {
			html += "<b>Signups background color</b><br />";
			html += this.signupsBackgroundColorPicker.render();
		} else if (signupsButtons) {
			html += "<b>Signups buttons background color</b><br />";
			html += this.signupsButtonColorPicker.render();
		} else if (backgroundBorder) {
			html += "<b>Background border</b><br />";
			html += this.backgroundBorderStyle.render();
		} else if (buttonsBorder) {
			html += "<b>Buttons border</b><br />";
			html += this.buttonsBorderStyle.render();
		} else if (trainer) {
			html += this.trainerPicker.render();
		} else {
			html += "<b>Pokemon</b><br />";
			html += this.pokemonModelPicker.render();
		}

		html += "</div>";
		return html;
	}
}

export const commands: BaseCommandDefinitions = {
	[baseCommand]: {
		command(target, room, user) {
			if (!this.isPm(room)) return;
			const targets = target.split(",");
			const targetRoom = Rooms.search(targets[0]);
			if (!targetRoom) return this.sayError(['invalidBotRoom', targets[0]]);
			targets.shift();

			if (!Config.gameHostBoxRequirements || !(targetRoom.id in Config.gameHostBoxRequirements)) {
				return this.say("Game host boxes are not enabled for " + targetRoom.title + ".");
			}

			const checkBits = !user.hasRank(targetRoom, 'voice');
			const database = Storage.getDatabase(targetRoom);
			const annualBits = Storage.getAnnualPoints(targetRoom, Storage.gameLeaderboard, user.name);
			if (checkBits && Config.gameHostBoxRequirements[targetRoom.id].background > 0) {
				if (annualBits < Config.gameHostBoxRequirements[targetRoom.id].background) {
					return this.say("You need to earn at least " + Config.gameHostBoxRequirements[targetRoom.id].background + " annual " +
						"bits before you can use this command.");
				}
			}

			if (!database.gameHostBoxes) database.gameHostBoxes = {};

			const cmd = Tools.toId(targets[0]);
			targets.shift();

			if (!cmd) {
				new GameHostBox(targetRoom, user).open();
			} else if (cmd === chooseBackgroundColorPicker) {
				if (!(user.id in pages)) new GameHostBox(targetRoom, user);
				pages[user.id].chooseBackgroundColorPicker();
			} else if (cmd === chooseButtonColorPicker) {
				if (!(user.id in pages)) new GameHostBox(targetRoom, user);
				pages[user.id].chooseButtonColorPicker();
			} else if (cmd === chooseSignupsBackgroundColorPicker) {
				if (!(user.id in pages)) new GameHostBox(targetRoom, user);
				pages[user.id].chooseSignupsBackgroundColorPicker();
			} else if (cmd === chooseSignupsButtonColorPicker) {
				if (!(user.id in pages)) new GameHostBox(targetRoom, user);
				pages[user.id].chooseSignupsButtonColorPicker();
			} else if (cmd === chooseBackgroundBorderPicker) {
				if (!(user.id in pages)) new GameHostBox(targetRoom, user);
				pages[user.id].chooseBackgroundBorderPicker();
			} else if (cmd === chooseButtonsBorderPicker) {
				if (!(user.id in pages)) new GameHostBox(targetRoom, user);
				pages[user.id].chooseButtonsBorderPicker();
			} else if (cmd === chooseTrainerPicker) {
				if (!(user.id in pages)) new GameHostBox(targetRoom, user);
				pages[user.id].chooseTrainerPicker();
			} else if (cmd === choosePokemonModelPicker) {
				if (!(user.id in pages)) new GameHostBox(targetRoom, user);
				pages[user.id].choosePokemonModelPicker();
			} else if (cmd === closeCommand) {
				if (!(user.id in pages)) new GameHostBox(targetRoom, user);
				pages[user.id].close();
				delete pages[user.id];
			} else {
				if (!(user.id in pages)) new GameHostBox(targetRoom, user);
				const error = pages[user.id].checkComponentCommands(cmd, targets);
				if (error) this.say(error);
			}
		},
		aliases: ['ghb'],
	},
};