<template>
  <div id="wrapper">
    <div class="main-l">
      <div class="item">
        <div class="btn" @click="add">添加视频</div>
        <span class="save-dir">{{this.videoList.length}}</span>
      </div>
      <div class="item">
        <div class="btn" @click="selcetOutputPath">输出目录</div>
        <span class="save-dir">{{outputPath}}</span>
      </div>
      <div class="item">
        <div class="btn" @click="run">执行</div>
        <span class="save-dir"></span>
      </div>
      <div class="item">
        <!-- <div class="item-h">
          <input type="checkbox" name="vehicle" value="Car" />
          <label for="male">切割视频</label>
        </div>-->
        <div class="item-main">
          <div class="list">
            <label for>视频加速（倍速）</label>
            <input type="number" v-model="accelerate[0]" />
          </div>
          <div class="list">
            <label for>音频加速（倍速）</label>
            <input type="number" v-model="accelerate[1]" />
          </div>
          <div class="list">
            <label for>顶部裁剪（像素）</label>
            <input type="text" v-model="crop[0]" />
          </div>
          <div class="list">
            <label for>底部裁剪（像素）</label>
            <input type="text" v-model="crop[1]" />
          </div>
          <div class="list">
            <label for>左边裁剪（像素）</label>
            <input type="text" v-model="crop[2]" />
          </div>
          <div class="list">
            <label for>右边裁剪（像素）</label>
            <input type="text" v-model="crop[3]" />
          </div>
          <div class="list">
            <label for>片头减时（秒）</label>
            <input type="number" v-model="cut[0]" />
          </div>
          <div class="list">
            <label for>片尾减时（秒）</label>
            <input type="number" v-model="cut[1]" />
          </div>
        </div>
        <!-- <div class="item">
          <div class="item-h">
            <input type="checkbox" name="vehicle" v-model="reversal" />
            <label for="male">左右翻转</label>
          </div>
        </div>-->
        <!-- <div class="item">
          <div class="item-h">
            <input type="checkbox" name="vehicle" value="Car" />
            <label for="male">去除logo</label>
          </div>
          <div class="item-main">
            <div class="list">
              <label for>自定义位置</label>
              <input type="text" />
            </div>
          </div>
        </div>-->
        <div class="item">
          <!-- <div class="item-h">
            <input type="checkbox" name="vehicle" value="Car" />
            <label for="male">添加背景</label>
          </div>-->
          <div class="item-main">
            <div class="list">
              <div class="btn" @click="addBg">选择背景图片</div>
              <input type="text" />
              <img :src="backgroundImg" alt style="display:block;max-width:200px;margin:10px 0;" />
            </div>
          </div>
        </div>
      </div>
    </div>
    <div class="main-r">
      <div v-for="(item,index) in videoNameList" :key="index" class="video-list">
        <div class="video-name">{{item}} /{{parseInt(percent[index]?percent[index]:0)}}%</div>
        <div class="process-wrapper">
          <div class="process" :style="{width:parseInt(percent[index]?percent[index]:0)+'%'}"></div>
        </div>
      </div>
    </div>
  </div>
</template>

<script>
let app = require("electron").remote;
let path = require("path");
import ffmpeg from "../../utiles/ffmpeg";
//'C:\\xiangmu\\electron\\video\\myvideo\\src\\4.mp4'
export default {
  name: "main-page",
  components: {},
  data() {
    return {
      cut: [0, 0], //视频减切,单位秒,[开始时间，结束时间]
      crop: [0, 0, 0, 0], //视频裁剪
      reversal: 0, //左右翻转1
      accelerate: [1, 1], //加速
      blurred: [0, 0, 0, 0], //模糊
      videoList: [],
      percent: [],
      outputPath: "",
      backgroundImg: ""
    };
  },
  computed: {
    videoNameList() {
      return this.videoList.map(item => {
        return path.basename(item);
      });
    }
  },
  methods: {
    add() {
      app.dialog
        .showOpenDialog({
          title: "选择视频",
          properties: ["openFile", "multiSelections"]
        })
        .then(result => {
          console.log(result);
          this.videoList = result.filePaths;
        });
    },
    addBg() {
      app.dialog
        .showOpenDialog({
          title: "选择背景图片",
          properties: ["openFile", "multiSelections"]
        })
        .then(result => {
          console.log(result);
          this.backgroundImg = result.filePaths[0];
        });
    },
    selcetOutputPath() {
      app.dialog
        .showOpenDialog({
          title: "选择输出目录",
          properties: ["openDirectory", "multiSelections"]
        })
        .then(result => {
          console.log(result);
          this.outputPath = result.filePaths[0];
        });
    },
    run() {
      let options = {
        cut: this.cut,
        crop: this.crop,
        reversal: this.reversal,
        accelerate: this.accelerate,
        blurred: this.blurred,
        background: { img: this.backgroundImg }
      };
      if(!this.videoList.length){
        alert('请选择视频');
      }
      if(!this.outputPath){
        alert('请选择输出目录');
      }
      let percentList = [];
      let callBack = {
        progress: (i, percent) => {
          percentList[i] = percent;
          this.percent = percentList;
          console.log(this.percent);
          this.$forceUpdate();
        }
      };
      ffmpeg.init(this.videoList, this.outputPath, { options, callBack }).run();
    }
  }
};
</script>

<style>
* {
  box-sizing: border-box;
  margin: 0;
  padding: 0;
}

body {
  font-family: "Source Sans Pro", sans-serif;
  -webkit-user-select: none;
  user-select: none;
}

#wrapper {
  height: 100vh;
  font-size: 12px;
  display: flex;
  background-color: azure;
}
.btn {
  border: 1px solid #ccc;
  display: inline-block;
  color: #333;
  padding: 3px;
  border-radius: 3px;
  background: #ccc;
  cursor: default;
}
.btn:hover{
  background-color:darksalmon;
  color: #fff;
}
.item-h {
  display: flex;
  align-items: center;
}

.item .list {
  margin: 5px 0;
}

.item .list input {
  width: 50px;
}

.main-l {
  width: 60vw;
  height: 100vh;
  background-color: azure;
}
.main-r {
  width: 40vw;
  height: 100vh;
  background: #fff;
}

.video-list {
  width: 100%;
  height: 30px;
  padding: 0 4px;
  background-color: darksalmon;
}
.video-name {
  height: 20px;
}
.process-wrapper {
  height: 4px;
  width: 100%;
  background: #ccc;
}
.process {
  height: 4px;
  width: 0;
  background-color: darkgreen;
}
.item {
  margin: 10px;
}
</style>
