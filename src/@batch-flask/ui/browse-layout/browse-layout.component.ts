import {
    AfterContentInit, ChangeDetectionStrategy, ChangeDetectorRef, Component, ContentChild, Input,
} from "@angular/core";
import { FormControl } from "@angular/forms";
import { ActivatedRoute } from "@angular/router";

import { MatDialog } from "@angular/material";
import { Filter, FilterBuilder, autobind } from "@batch-flask/core";
import { ListSelection } from "@batch-flask/core/list";
import { DeleteSelectedItemsDialogComponent } from "@batch-flask/ui/list-and-show-layout";
import { Subscription } from "rxjs";
import { BrowseLayoutAdvancedFilterDirective } from "./browse-layout-advanced-filter";
import { BrowseLayoutListDirective } from "./browse-layout-list";
import "./browse-layout.scss";

export interface BrowseLayoutConfig {
    /**
     * Name of the field the quicksearch is going to build
     * @default id
     */
    quickSearchField?: string;
    /**
     * Field to be used for the key
     * Route param should match this
     * @default id
     */
    keyField?: string;

    mergeFilter?: (quickSearch: Filter, advanced: Filter) => Filter;
}

const defaultConfig: BrowseLayoutConfig = {
    quickSearchField: "id",
    keyField: "id",
};
@Component({
    selector: "bl-browse-layout",
    templateUrl: "browse-layout.html",
    changeDetection: ChangeDetectionStrategy.OnPush,
})
export class BrowseLayoutComponent implements AfterContentInit {
    /**
     * Field for the quicksearch.
     * @default id.
     */
    @Input() public set config(config: BrowseLayoutConfig) {
        this._config = { ...defaultConfig, ...config };
    }
    public get config() { return this._config; }
    @Input() public keyField = "id";

    @ContentChild(BrowseLayoutListDirective)
    public listDirective: BrowseLayoutListDirective;
    @ContentChild(BrowseLayoutAdvancedFilterDirective)
    public advancedFilterDirective: BrowseLayoutAdvancedFilterDirective;

    public quickSearchQuery = new FormControl("");
    public filter: Filter = FilterBuilder.none();
    public quickFilter: Filter = FilterBuilder.none();
    public advancedFilter: Filter = FilterBuilder.none();
    public showAdvancedFilter = false;
    public deleteSelectionIsEnabled = false;
    public refreshEnabled = false;

    public selection = new ListSelection();

    private _activeItemKey: string = null;
    private _config: BrowseLayoutConfig = defaultConfig;
    private _selectionChangeSub: Subscription;

    constructor(activeRoute: ActivatedRoute, private changeDetector: ChangeDetectorRef, private dialog: MatDialog) {
        this.quickSearchQuery.valueChanges.debounceTime(400).distinctUntilChanged().subscribe((query: string) => {
            if (query === "") {
                this.quickFilter = FilterBuilder.none();
            } else {
                this.quickFilter = FilterBuilder.prop(this.config.quickSearchField).startswith(query.clearWhitespace());
            }
            this._updateFilter();
        });

        activeRoute.queryParams.subscribe((params: any) => {
            if (params.filter) {
                this.toggleFilter(true);
            }
        });

        activeRoute.url.subscribe((url) => {
            const child = activeRoute.snapshot.firstChild;
            if (child) {
                const params = child.params;
                const key = params[this.keyField];
                if (key) {
                    this.updateActiveItem(key);
                }
            } else {
                this.updateActiveItem(null);
            }
        });
    }

    public ngAfterContentInit() {
        if (!this.listDirective) {
            throw new Error("BrowseLayout expect an list component to have the directive blBrowseLayoutList");
        }
        const component = this.listDirective.component;
        component.quicklist = true;
        component.activeItem = this._activeItemKey;
        this.selection = component.selection;
        this.deleteSelectionIsEnabled = Boolean(component.deleteSelection);
        this.refreshEnabled = Boolean(component.refresh);
        this.changeDetector.markForCheck();
        this._selectionChangeSub = this.listDirective.component.selectionChange.subscribe((x) => {
            this.selection = x;
            this.changeDetector.markForCheck();
        });
    }

    public _ngOnDestroy() {
        if (this._selectionChangeSub) {
            this._selectionChangeSub.unsubscribe();
        }
    }

    /**
     * Get triggered when a key is pressed while focus is in the quick searchbox
     * If it is arrow down it will move the focus down in the list so you can navigate elements there.
     */
    public handleKeyPressedInQuickSearch(event: KeyboardEvent) {
        if (event.code === "ArrowDown") {
            event.preventDefault();
            event.stopPropagation();
            if (this.listDirective.component.focusSection) {
                this.listDirective.component.focusSection.focus();
            }
        }
    }

    public toggleFilter(value?: boolean) {
        this.showAdvancedFilter = (value === undefined ? !this.showAdvancedFilter : value);
        this.listDirective.component.quicklist = !this.showAdvancedFilter;
        this.changeDetector.markForCheck();
    }

    public listScrolledToBottom() {
        if (this.listDirective.component.onScrollToBottom) {
            this.listDirective.component.onScrollToBottom();
        }
    }

    @autobind()
    public refresh() {
        if (!this.listDirective.component.refresh) { return; }
        return this.listDirective.component.refresh();
    }

    public advancedFilterChanged(filter: Filter) {
        this.advancedFilter = filter;
        this._updateFilter();
    }

    public updateActiveItem(key: string) {
        this._activeItemKey = key;
        if (this.listDirective) {
            this.listDirective.component.activeItem = key;
        }
    }

    /**
     * Show a dialog promping the user for confirmation then callback to the list for deleting
     */
    @autobind()
    public deleteSelection() {
        const dialogRef = this.dialog.open(DeleteSelectedItemsDialogComponent);
        dialogRef.componentInstance.items = [...this.selection.keys];
        dialogRef.afterClosed().subscribe((proceed) => {
            if (proceed) {
                this.listDirective.component.deleteSelection(this.selection);
                this.listDirective.component.selection = new ListSelection();
            }
        });
    }

    private _updateFilter() {
        if (this.config.mergeFilter) {
            this.filter = this.config.mergeFilter(this.quickFilter, this.advancedFilter);
        } else {
            this.filter = FilterBuilder.and(this.quickFilter, this.advancedFilter);
        }
        this.listDirective.component.filter = this.filter;
    }
}
