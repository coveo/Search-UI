import {Dropdown} from '../Form/Dropdown';
import {NumericSpinner} from '../Form/NumericSpinner';
import {$$} from '../../../utils/Dom';
import {DocumentInput} from './DocumentInput';


export class SizeInput extends DocumentInput {

  public static modes = ['AtLeast', 'AtMost'];
  public static sizes = ['KB', 'MB', 'Bytes'];

  protected element: HTMLElement;
  public modeSelect: Dropdown;
  public sizeInput: NumericSpinner;
  public sizeSelect: Dropdown;

  constructor() {
    super('Size');
  }

  public build(): HTMLElement {
    let sizeInput = $$(super.build());
    this.modeSelect = new Dropdown(SizeInput.modes, 'coveo-size-input-mode');
    sizeInput.append(this.modeSelect.getElement());
    this.sizeInput = new NumericSpinner();
    sizeInput.append(this.sizeInput.getElement());
    this.sizeSelect = new Dropdown(SizeInput.sizes, 'coveo-size-input-select');
    sizeInput.append(this.sizeSelect.getElement());
    this.element = sizeInput.el;
    return this.element;
  }

  public getValue(): string {
    let size = this.getSizeInBytes();
    if (size) {
      switch (this.modeSelect.getValue()) {
        case 'AtLeast':
          return '@size>=' + this.getSizeInBytes()
        default:
          return '@size<=' + this.getSizeInBytes();
      }
    }
    return '';
  }

  private getSizeInBytes(): number {
    let size = this.sizeInput.getFloatValue();
    switch (this.sizeSelect.getValue()) {
      case 'KB':
        return size * 1024;
      case 'MB':
        return size * Math.pow(1024, 2)
      default:
        return size;
    }
  }

}
