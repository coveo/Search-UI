import { AccessibleModal } from '../../utils/AccessibleModal';
import { l } from '../../strings/Strings';
import { $$ } from '../../utils/Dom';
import { RadioButton } from '../FormWidgets/RadioButton';
import 'styling/_ExplanationModal';

export interface IExplanation {
  label: string;
  onSelect: () => void;
  hasDetails?: boolean;
}

export interface IExplanationModalOptions {
  ownerElement: HTMLElement;
  explanations: IExplanation[];
  onClosed: () => void;
  modalBoxModule?: Coveo.ModalBox.ModalBox;
}

const ROOT_CLASSNAME = 'coveo-user-explanation-modal';
const CONTENT_CLASSNAME = `${ROOT_CLASSNAME}-content`;
const EXPLANATIONS_CLASSNAME = `${ROOT_CLASSNAME}-explanations`;
const DETAILS_SECTION_CLASSNAME = `${ROOT_CLASSNAME}-details`;
const DETAILS_TEXTAREA_CLASSNAME = `${DETAILS_SECTION_CLASSNAME}-textarea`;
const DETAILS_LABEL_CLASSNAME = `${DETAILS_SECTION_CLASSNAME}-label`;
const SEND_BUTTON_CLASSNAME = `${ROOT_CLASSNAME}-send-button`;

export class ExplanationModal {
  private modal: AccessibleModal;
  private explanationRadioButtons: RadioButton[];
  private selectedExplanation: IExplanation;
  private detailsTextArea: HTMLTextAreaElement;

  constructor(public options: IExplanationModalOptions) {
    this.modal = new AccessibleModal(ROOT_CLASSNAME, this.options.ownerElement, this.options.modalBoxModule);
  }

  public get details() {
    if (!this.selectedExplanation || !this.selectedExplanation.hasDetails) {
      return null;
    }
    return this.detailsTextArea.value;
  }

  public open(origin: HTMLElement) {
    this.modal.open({
      origin,
      title: l('UsefulnessFeedbackExplainWhyImperative'),
      content: this.buildContent(),
      validation: () => {
        this.options.onClosed();
        return true;
      }
    });
  }

  private buildContent() {
    const detailsSection = this.buildDetailsSection();
    return $$(
      'div',
      {
        className: CONTENT_CLASSNAME
      },
      this.buildExplanations(),
      detailsSection,
      this.buildSendButton()
    ).el;
  }

  private buildExplanations() {
    const explanationsContainer = $$('div', { className: EXPLANATIONS_CLASSNAME }).el;
    this.explanationRadioButtons = this.options.explanations.map(explanation => this.buildExplanationRadioButton(explanation));
    this.explanationRadioButtons[0].select();
    this.explanationRadioButtons.forEach(radioButton => explanationsContainer.appendChild(radioButton.getElement()));
    return explanationsContainer;
  }

  private buildDetailsSection() {
    return $$(
      'div',
      { className: DETAILS_SECTION_CLASSNAME },
      $$('span', { className: DETAILS_LABEL_CLASSNAME }, l('Details')).el,
      (this.detailsTextArea = $$('textarea', { className: DETAILS_TEXTAREA_CLASSNAME, disabled: true }).el as HTMLTextAreaElement)
    );
  }

  private buildSendButton() {
    const button = $$('button', { className: SEND_BUTTON_CLASSNAME }, l('Send'));
    button.on('click', () => {
      this.selectedExplanation.onSelect();
      this.modal.close();
    });
    return button.el;
  }

  private buildExplanationRadioButton(explanation: IExplanation) {
    return new RadioButton(
      radioButton => {
        if (!radioButton.isSelected()) {
          return;
        }
        this.detailsTextArea.disabled = !explanation.hasDetails;
        this.selectedExplanation = explanation;
      },
      explanation.label,
      'explanation'
    );
  }
}
