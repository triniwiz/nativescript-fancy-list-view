<template>
<Page>
    <FancyListView orientation="vertical" for="item in items" layoutType="grid" spanCount="2" hideScrollBar="true">
        <v-template>
                <GridLayout rows="auto,*">
                    <Label :text="item.title" class="t-20 text-center c-black" textWrap="true"/>
                    <ImageCacheIt stretch="fill" row="1" :imageUri="item.image"></ImageCacheIt>
                </GridLayout>
            </v-template>

 <v-template if="$even">
                <GridLayout rows="auto,*">
                    <Label :text="item.title" class="t-20 text-center c-black" textWrap="true"/>
                    <ImageCacheIt stretch="fill" row="1" :imageUri="item.image"></ImageCacheIt>
                </GridLayout>
            </v-template>
        <v-template if="$odd">
                <GridLayout rows="auto,*" background="red">
                    <Label :text="item.title" class="t-20 text-center c-black" textWrap="true"/>
                    <ImageCacheIt resize="300,300" stretch="fill" row="1" :imageUri="item.image"></ImageCacheIt>
                </GridLayout>
            </v-template>
    </FancyListView>
</Page>
</template>
<script>
import data from '../data';
export default {
  name: 'multi',
  data() {
    return {
      items: data.items
    };
  }
};
</script>
