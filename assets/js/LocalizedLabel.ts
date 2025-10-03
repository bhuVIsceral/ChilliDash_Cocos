import { _decorator, Component, Node, Label, Enum } from 'cc';
import { ETextKey } from './LocalizationData';
import { languageChangeEvent, LocalizationManager } from './LocalizationManager';
const { ccclass, property } = _decorator;

// This makes our ETextKey enum show up as a dropdown in the editor
Enum(ETextKey);

@ccclass('LocalizedLabel')
export class LocalizedLabel extends Component {

    // This property will be a dropdown in the Inspector
    @property({ type: ETextKey })
    public textKey: ETextKey = ETextKey.PLAY;

    private label: Label | null = null;

    onLoad() {
        this.label = this.getComponent(Label);
        // Listen for the language change event
        languageChangeEvent.on('language-changed', this.updateText, this);
    }

    start() {
        // Set the initial text when the game starts
        this.updateText();
    }
    
    onDestroy() {
        // Clean up the listener
        languageChangeEvent.off('language-changed', this.updateText, this);
    }

    private updateText() {
        if (this.label && LocalizationManager.instance) {
            this.label.string = LocalizationManager.instance.getTranslation(this.textKey);
        }
    }
}
