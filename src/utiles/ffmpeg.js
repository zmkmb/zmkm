let path = require("path");
let fluent_fmpeg = require("fluent-ffmpeg");
const FFMPEGPATH = path.resolve(__dirname) + "/../../../bin/ffmpeg.exe";
let outputPath = path.resolve(__dirname) + '/../output/';
const node_env  = process.env.NODE_ENV;
let ffmpeg = {
    videoList: [],
    options: {},
    outputPath: outputPath,
    callBack: {
        progress: () => {

        }
    },
    outputOptions: [],
    init(videoList, outputPath, param) {
        this.videoList = videoList ? videoList : [];
        this.options = param.options;
        this.outputPath = outputPath ? outputPath + '/' : this.outputPath;
        this.callBack = param.callBack ? param.callBack : this.callBack;
        return this;
    },
    run() {
        return new Promise((resolve, reject) => {
            if (!this.videoList.length) {
                reject();
                console.log('no video')
            }
            for (let i = 0; i < this.videoList.length; i++) {
                this.editVideo(i);
            }
        })
    },
    setOutputOptions(fmg,options, videoInfo) {
        let cut = options.cut;
        let crop = options.crop;
        let accelerate = options.accelerate;
        let cutParam, cropParam, backgroundParam,accelerateParam;
        let info = {};
        info.width = videoInfo.streams[0].width;
        info.height = videoInfo.streams[0].height;
        info.time = videoInfo.streams[0].duration;
        console.log(videoInfo.streams[0])
        if (options.cut) {
            fmg.addOption('-ss',cut[0]);
            fmg.addOption('-t',info.time - cut[1]);
        }

        if (options.crop) {
            let top = String(options.crop[0]);
            let bottom = String(options.crop[1]);
            let left = String(options.crop[2]);
            let right = String(options.crop[3]);
            if (top.indexOf('%') > -1) {
                top = info.height * (top.replace('%', '') / 100);
            }
            if (bottom.indexOf('%') > -1) {
                bottom = info.height * (bottom.replace('%', '') / 100);
            }
            if (left.indexOf('%') > -1) {
                left = info.width * (left.replace('%', '') / 100);
            }
            if (right.indexOf('%') > -1) {
                right = info.width * (right.replace('%', '') / 100);
            }
            let w = info.width - left - right;
            let h = info.height - top - bottom;
            cropParam = `crop=${w}:${h}:${left}:${top}`;
        }

        if (options.background.img) {
            backgroundParam = `[1]scale=${parseInt((info.width/32))*32}:${parseInt((info.height/2))*2}[bg];[bg][crop]overlay=(W-w)/2:(H-h)/2`
        }

        //音视频加速
        if(options.accelerate){
            accelerateParam = `[0:v]setpts=${(1/accelerate[0]).toFixed(2)}*PTS[v];[0:a]atempo=${accelerate[1]}[a]`;
        }

        let vf = `${accelerateParam};[v]${cropParam}[crop]`;

        if(backgroundParam){
            vf = `${vf};${backgroundParam}`;
        }
        

        console.log(vf)
        fmg.addOption('-filter_complex',vf);
        fmg.addOption('-map','[a]');
        return fmg;
    },
    editVideo(i) {
        
        let videoPath = this.videoList[i]
        let fmg = fluent_fmpeg();
        let fileName = path.basename(videoPath);
        //如果非开发环境设置ffmpeg路径
        if(node_env !== "development"){
            fmg.setFfmpegPath(FFMPEGPATH);
        }
        fmg.input(videoPath)
        if(this.options.background.img){
            fmg.input(this.options.background.img)
        }
        
        fmg.ffprobe(0,(err, data) => {
            console.log(data)
            fmg = this.setOutputOptions(fmg,this.options, data);
            fmg.save(this.outputPath + fileName);
        })

        fmg.on('progress', (progress) => {
            this.callBack.progress(i, progress.percent)
            console.log('Processing: ' + progress.percent + '% done');
        });

        fmg.on('end', () => {
            this.callBack.progress(i, 100)
        })
    }
}

export default ffmpeg;
