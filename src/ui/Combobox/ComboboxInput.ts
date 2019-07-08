import { TextInput, ITextInputOptions } from '../FormWidgets/TextInput';
import { $$ } from '../../utils/Dom';
import { Combobox } from './Combobox';
import { KEYBOARD } from '../../utils/KeyboardUtils';
import { Utils } from '../../utils/Utils';

export interface IComboboxAccessibilityAttributes {
  activeDescendant: string;
  expanded: boolean;
}

export class ComboboxInput {
  public element: HTMLElement;
  private textInput: TextInput;
  private inputElement: HTMLElement;
  private inputOptions: ITextInputOptions = {
    usePlaceholder: true,
    className: 'coveo-combobox-input',
    triggerOnChangeAsYouType: true
  };

  constructor(private combobox: Combobox) {
    this.create();
    this.element = this.textInput.getElement();
    this.inputElement = $$(this.element).find('input');
    this.addEventListeners();
    this.addAccessibilityAttributes();
  }

  private create() {
    this.textInput = new TextInput(
      (inputInstance: TextInput) => this.combobox.onInputChange(inputInstance.getValue()),
      this.combobox.options.placeholderText,
      this.inputOptions
    );
  }

  private addEventListeners() {
    if (!this.combobox.options.clearOnBlur) {
      $$(this.inputElement).on('focus', () => this.combobox.onInputChange(this.textInput.getValue()));
    }
    $$(this.inputElement).on('blur', this.combobox.onInputBlur.bind(this.combobox));
    $$(this.inputElement).on('keydown', this.handleKeyboardDownEvent.bind(this));
    $$(this.inputElement).on('keyup', this.handleKeyboardUpEvent.bind(this));
  }

  private addAccessibilityAttributes() {
    const listboxId = `${this.combobox.id}-listbox`;
    this.element.setAttribute('role', 'combobox');
    this.element.setAttribute('aria-owns', listboxId);
    this.element.setAttribute('aria-aria-haspopup', 'listbox');

    this.inputElement.setAttribute('id', `${this.combobox.id}-input`);
    this.inputElement.setAttribute('aria-autocomplete', 'list');
    this.inputElement.setAttribute('aria-controls', listboxId);

    this.updateAccessibilityAttributes({
      activeDescendant: '',
      expanded: false
    });
  }

  public updateAccessibilityAttributes(attributes: IComboboxAccessibilityAttributes) {
    this.element.setAttribute('aria-expanded', attributes.expanded ? 'true' : 'false');
    this.inputElement.setAttribute('aria-activedescendant', attributes.activeDescendant);
  }

  public clearInput() {
    this.textInput.reset();
  }

  private handleKeyboardDownEvent(event: KeyboardEvent) {
    switch (event.which) {
      case KEYBOARD.DOWN_ARROW:
        event.preventDefault();
        this.combobox.values.moveActiveValueDown();
        break;
      case KEYBOARD.UP_ARROW:
        event.preventDefault();
        this.combobox.values.moveActiveValueUp();
        break;
    }
  }

  private handleKeyboardUpEvent(event: KeyboardEvent) {
    switch (event.which) {
      case KEYBOARD.ENTER:
        this.combobox.values.selectActiveValue();
        break;
      case KEYBOARD.ESCAPE:
        if (Utils.isNonEmptyString(this.textInput.getValue())) {
          event.stopPropagation();
        }
        this.combobox.clearAll();
        break;
    }
  }
}
