import type { HtmlPageBase } from "../html-page-base";
import type { ITextInputProps } from "./text-input";
import { TextInput } from "./text-input";

export class ImageSourceTextInput extends TextInput {
	componentId: string = 'image-source-text-input';

	// eslint-disable-next-line @typescript-eslint/no-useless-constructor
	constructor(htmlPage: HtmlPageBase, parentCommandPrefix: string, componentCommand: string, props: ITextInputProps) {
		super(htmlPage, parentCommandPrefix, componentCommand, props);
	}

	/**Keep the slashes that make up the URL, unlike the default text input */
	stripInput(input: string): string {
		return Tools.stripImageSourceCharacters(input);
	}

	onSubmit(input: string): void {
		if (!Tools.isSafeImageSource(input)) {
			this.errors.push("You must specify a valid image link beginning with https:// (for example, " +
				"https://play.pokemonshowdown.com/sprites/trainers/1.png).");
		}

		this.currentOutput = input;
	}
}
