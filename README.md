[![npm](https://img.shields.io/npm/v/nativescript-fancy-list-view.svg)](https://www.npmjs.com/package/nativescript-fancy-list-view)
[![npm](https://img.shields.io/npm/dt/nativescript-fancy-list-view.svg?label=npm%20downloads)](https://www.npmjs.com/package/nativescript-fancy-list-view)
[![Build Status](https://travis-ci.org/triniwiz/nativescript-fancy-list-view.svg?branch=master)](https://travis-ci.org/triniwiz/nativescript-fancy-list-view)

# NativeScript FancyListView 🍵

## Install

`tns plugin add nativescript-fancy-list-view`

## Usage

IMPORTANT: Make sure you include `xmlns:lv="nativescript-fancy-list-view"` on the Page element any element can be used in the list

```xml
<lv:FancyListView items="{{items}}" row="2" id="listView">
            <lv:FancyListView.itemTemplate>
                <GridLayout rows="auto, *" columns="*" backgroundColor="red">
                    <Label text="{{title}}"/>
                    <Image row="1" src="{{image}}"/>
                </GridLayout>
            </lv:FancyListView.itemTemplate>
</lv:FancyListView>
```

### Multi Template

```xml
<lv:FancyListView itemTemplateSelector="$index % 2 === 0 ? 'even' : 'odd'" items="{{items}}" id="listView">
      <FancyListView.itemTemplates>
        <template key="even">
          <GridLayout rows="auto,auto,*" columns="*">
            <Label text="Even"/>
            <Label row="1" text="{{title}}"/>
            <Image loaded="loadedImage" row="2" src="{{image}}"/>
          </GridLayout>
        </template>
        <template key="odd">
          <GridLayout rows="auto,auto ,auto,*" columns="*" backgroundColor="white">
            <Label text="Odd"/>
            <Label row="1" text="{{title}}"/>
            <StackLayout row="2">
              <Label text="{{image}}"/>
            </StackLayout>
            <Image loaded="loadedImage" row="3" src="{{image}}"/>
          </GridLayout>
        </template>
      </FancyListView.itemTemplates>
    </lv:FancyListView>
```

### Angular

```js
import { FancyListViewModule } from "nativescript-fancy-list-view/angular";

@NgModule({
    imports: [
    FancyListViewModule
    ],
    declarations: [
        AppComponent
    ],
    bootstrap: [AppComponent]
})
```

_Angular v2_

```html
<FancyListView [items]="items" #listview (itemTap)="onTap($event)" class="listview">
        <template let-i="index" let-item="item">
            <GridLayout class="list-item" rows="auto, *" columns="*" backgroundColor="red">
                <Label  [text]="item.title"></Label>
                <Image row="1" [src]="item.image"></Image>
            </GridLayout>
        </template>
    </FancyListView>
```

_Angular v4+_

```html
<FancyListView [items]="items" #listView (itemTap)="onTap($event)" class="listview">
        <ng-template let-i="index" let-item="item">
            <GridLayout class="list-item" rows="auto, *" columns="*" backgroundColor="red">
                <Label  [text]="item.title"></Label>
                <Image row="1" [src]="item.image"></Image>
            </GridLayout>
        </ng-template>
    </FancyListView>
```

### Multi Template

```ts
 public templateSelector = (item: any, index: number, items: any) => {
    return index % 2 === 0 ? 'even' : 'odd';
  }
```

```html
<FancyListView [items]="items | async" [itemTemplateSelector]="templateSelector"  #listView (itemTap)="onTap($event)" class="listview">
        <ng-template flvTemplateKey="even" let-i="index" let-item="item">
            <GridLayout class="list-item" rows="auto,auto,*" columns="*">
                <Label text="Even"></Label>
                <Label row="1" [text]="item.title"></Label>
                <Image loaded="loadedImage" row="2" [src]="item.image"></Image>
            </GridLayout>
        </ng-template>

        <ng-template flvTemplateKey="odd" let-i="index" let-item="item">
            <GridLayout class="list-item" rows="auto,auto,auto,*" columns="*" backgroundColor="white">
                <Label text="Odd"></Label>
                <Label row="1" [text]="item.title"></Label>
                <StackLayout row="2">
                    <Label [text]="item.image"></Label>
                </StackLayout>
                <Image loaded="loadedImage" row="3" [src]="item.image" ></Image>
            </GridLayout>
        </ng-template>

    </FancyListView>
```

## Configuration

```html
<FancyListView items="{{items}}" itemWidth="25%" itemHeight="50%" max="75%" min="20%" spanCount="2" layoutType="grid"><FancyListView>
```

## Properties

| Property   | Default                  | Type              | Required                 | Description |
| ---------- | ------------------------ | ----------------- | ------------------------ | ----------- |
| items      | null                     | Array             | <ul><li>- [x] </li></ul> |             |
| itemWidth  | 100%                     | `string | number` | <ul><li>- [ ] </li></ul> |             |
| itemHeight | 25%                      | `string | number` | <ul><li>- [ ] </li></ul> |             |
| min        | (itemWidth \* 2) / (1/3) | `string | number` | <ul><li>- [ ] </li></ul> |             |
| max        | (itemWidth \* 2)         | `string | number` | <ul><li>- [ ] </li></ul> |             |
| spanCount  | 1                        | number            | <ul><li>- [ ] </li></ul> |             |
| layoutType | linear                   | string            | <ul><li>- [ ] </li></ul> |             |

| IOS           | Android       |
| ------------- | ------------- |
| Coming Soon!! | Coming Soon!! |
