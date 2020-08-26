import 'styling/_SmartSnippetSuggestions';
import { Component } from '../Base/Component';
import { exportGlobally } from '../../GlobalExports';
import { IComponentBindings } from '../Base/ComponentBindings';
import { QueryEvents, IQuerySuccessEventArgs } from '../../events/QueryEvents';
import { IPartialQuestionAnswerResponse, IQuestionAnswerResponse } from '../../rest/QuestionAnswerResponse';
import { $$, Dom } from '../../utils/Dom';
import { uniqueId, isEqual } from 'underscore';
import { SmartSnippetCollapsibleSuggestion } from './SmartSnippetCollapsibleSuggestion';
import { l } from '../../strings/Strings';

const BASE_CLASSNAME = 'coveo-smart-snippet-suggestions';
const HAS_QUESTIONS_CLASSNAME = `${BASE_CLASSNAME}-has-questions`;
const QUESTIONS_LIST_CLASSNAME = `${BASE_CLASSNAME}-questions`;
const QUESTIONS_LIST_TITLE_CLASSNAME = `${QUESTIONS_LIST_CLASSNAME}-title`;

export interface ISmartSnippetSuggestionsOptions {}

export class SmartSnippetSuggestions extends Component {
  static ID = 'SmartSnippetSuggestions';

  static options: ISmartSnippetSuggestionsOptions = {};

  static doExport = () => {
    exportGlobally({
      SmartSnippetSuggestions
    });
  };

  private readonly titleId = uniqueId(QUESTIONS_LIST_TITLE_CLASSNAME);
  private contentLoaded: Promise<any>;
  private title: Dom;
  private questionAnswers: Dom;
  private renderedQuestionAnswer: IQuestionAnswerResponse;

  constructor(public element: HTMLElement, public options?: ISmartSnippetSuggestionsOptions, bindings?: IComponentBindings) {
    super(element, SmartSnippetSuggestions.ID, bindings);
    this.bind.onRootElement(QueryEvents.deferredQuerySuccess, (data: IQuerySuccessEventArgs) => this.handleQuerySuccess(data));
  }

  public get loading() {
    return this.contentLoaded;
  }

  private handleQuerySuccess(data: IQuerySuccessEventArgs) {
    const questionAnswer = data.results.questionAnswer;
    const hasQuestions = !!(questionAnswer && questionAnswer.relatedQuestions.length);
    $$(this.element).toggleClass(HAS_QUESTIONS_CLASSNAME, hasQuestions);
    if (hasQuestions) {
      if (this.renderedQuestionAnswer && isEqual(questionAnswer, this.renderedQuestionAnswer)) {
        return;
      }
      this.detachContent();
      this.element.appendChild((this.title = this.buildTitle()).el);
      this.element.appendChild((this.questionAnswers = this.buildQuestionAnswers(questionAnswer.relatedQuestions)).el);
    } else {
      this.detachContent();
    }
    this.renderedQuestionAnswer = questionAnswer;
  }

  private detachContent() {
    this.title && this.title.detach();
    this.questionAnswers && this.questionAnswers.detach();
    this.title = this.questionAnswers = null;
  }

  private buildTitle() {
    return $$('span', { className: QUESTIONS_LIST_TITLE_CLASSNAME, id: this.titleId }, l('SuggestedQuestions'));
  }

  private buildQuestionAnswers(questionAnswers: IPartialQuestionAnswerResponse[]) {
    const innerCSS = this.getInnerCSS();
    const answers = questionAnswers.map(questionAnswer => new SmartSnippetCollapsibleSuggestion(questionAnswer, innerCSS));
    const container = $$(
      'ul',
      { className: QUESTIONS_LIST_CLASSNAME, ariaLabelledby: this.titleId },
      ...answers.map(answer => answer.build())
    );
    this.contentLoaded = Promise.all(answers.map(answer => answer.loading));
    return container;
  }

  private getInnerCSS() {
    return $$(this.element)
      .children()
      .filter(element => element instanceof HTMLScriptElement && element.type.toLowerCase() === 'text/css')
      .map(element => element.innerHTML)
      .join('\n');
  }
}
