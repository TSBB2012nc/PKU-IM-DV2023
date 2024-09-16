// 默认展示第一页
showPage1();


function addLogo() {
    d3.select("#page").append("div").attr("class", "title").attr("id", "title").append("svg").append("use").attr("xlink:href", "#nobel-logo")
}


function addHeader(title) {
    d3.select("#page").append("div").attr("class", "header").append('h1').text(title);
}

function newPage() {
    // 清空画布
    d3.select("#page").selectAll("*").remove();
}

// 获取画布的大小
function getWindowWidth() {
    return window.innerWidth || document.documentElement.clientWidth || document.body.clientWidth
}
function getWindowHeight() {
    return window.innerHeight || document.documentElement.clientHeight || document.body.clientWidth
}

WIDTH = getWindowWidth();
HEIGHT = getWindowHeight();


function showPage1() {
    // 清空画布
    newPage();
    addLogo();
    // TODO: 调整标题位置
    d3.select("#title").append("p").text("A Century of Nobel Prize");
    // add author info
    d3.select("#page").append("div").attr("class", "footer").text("Data Visualization, 2023 Spring, Liang Hu, Jiaqi Lei, Haoyang Wang, Xin He")
    // draw
    d3.select("#page").append("div").attr("id", "globeViz")
    // TODO: 增加交互
    // load data
    data = d3.csv("data/dots.csv").then((result) => {
        const gData = result.map((x) => ({
            lat: x.lat,
            lng: x.lng,
            maxR: 2,
            propagationSpeed: 0.5,
            repeatPeriod: 3000
        }));


        const colorInterpolator = t => `rgba(218,165,32,${Math.sqrt(1 - t)})`;  // 颜色渐变：金色，随时间变浅
        // globe 对象
        const globe = Globe()
            .globeImageUrl('earth-night.jpg')  // 地球仪背景图（需要开启live server）
            .backgroundImageUrl('./img/night-sky.png')
            .ringsData(gData)
            .ringColor(() => colorInterpolator)
            .ringMaxRadius('maxR')
            .ringPropagationSpeed('propagationSpeed')
            .ringRepeatPeriod('repeatPeriod')
            (document.getElementById('globeViz'));
        globe.controls().autoRotate = true;
        globe.controls().autoRotateSpeed = 0.85;
    });

}


function showPage2() {
    // TODO: 优化地图，台湾+藏南地区
    // TODO: 进度条拖动美化
    // TODO: 词云视差美化
    newPage();
    addLogo();
    // move logo
    d3.select("div.title").attr("style", "top:5%;right:10%;left: auto;height: 100rem;")
    addHeader('The Shifting Landscape: Laureate and Themes');



    d3.select("#page").append("div").attr("id", "main");
    //添加绘制地图的svg
    const margin = { top: 60, bottom: 60, left: 60, right: 60 }
    const map_svg = d3.select("#main")
        .append("svg")
        .attr('width', 0.6 * WIDTH)
        .attr('height', 0.8 * HEIGHT)
    // .style("background-color", "green");
    const map_width = map_svg.attr("width")
    const map_height = map_svg.attr("height")

    //投影函数
    var projection = d3.geoMercator()
        .center([2, 30])
        .scale(230)
        .translate([0.5 * map_width, 0.55 * map_height]);

    //路径
    var path = d3.geoPath(projection);

    //读取geojson数据并绘制地图
    d3.json("data/public_world.geojson").then(function (data) {
        map_svg.selectAll("g")
            .data(data.features)
            .enter()
            .append("g")
            .append("path")
            .attr('d', path)//使用地理路径生成器
            .attr("stroke", "#FFFFFF")
            .attr("stroke-width", 1)
            .attr("country", d => d['properties']['name'])
            .on("mouseover", function (e) {
                d3.select(this).attr('opacity', 0.5);
            })
            .on("mouseout", function () {
                d3.select(this).attr('opacity', 1);
            });
    });

    var start_year = 1902;
    var end_year = 2016;

    //绘图函数
    function draw_map(start_year, end_year) {
        // 读取诺奖得主数据
        d3.csv("data/map.csv").then(function (data) {

            //根据年份范围筛选数据
            var target_list = [];
            for (var i = 0; i < data.length; i++) {
                year = Number(data[i]['prize year']);
                if (year >= start_year && year <= end_year) {
                    target_list.push(data[i]);
                }
            }

            //从筛选后的数据获取 国家-获奖人数-获奖者id 数据
            var country_count = [];
            for (var i = 0; i < target_list.length; i++) {
                var country = target_list[i]['country'];
                var name = target_list[i]['laureate name'];
                var field = target_list[i]['field'];
                var year = target_list[i]['prize year'];
                var link = target_list[i]['photo link'];
                if (country != '') {
                    var flag = 0;
                    for (var j = 0; j < country_count.length; j++) {
                        if (country == country_count[j]['country']) {
                            country_count[j]['count'] += 1;
                            country_count[j]['info'].push({ 'name': name, 'field': field, 'year': year, 'link': link });
                            flag = 1;
                        }
                    }
                    if (flag == 0) {
                        country_count.push({ 'country': country, 'count': 1, 'info': [{ 'name': name, 'field': field, 'year': year, 'link': link }] });
                    }
                }
            }
            for (var j = 0; j < country_count.length; j++) {
                var country = country_count[j]['country'];
                if (country == 'China') {
                    var count = country_count[j]['count'];
                    var name = country_count[j]['info']['name'];
                    var field = country_count[j]['info']['field'];
                    var year = country_count[j]['info']['prize year'];
                    var link = country_count[j]['info']['photo link'];
                    //台湾是中国不可分割的一部分
                    country_count.push({ 'country': 'Taiwan', 'count': count, 'info': [{ 'name': name, 'field': field, 'year': year, 'link': link }] });
                }
            }

            // console.log(country_count);

            // 为得过诺奖的国家填色
            var countries = map_svg.selectAll("path");
            countries.attr("fill", function (d) {
                var country_name = d.properties.name;
                for (var i = 0; i < country_count.length; i++) {
                    if (country_name == country_count[i]['country']) {
                        return '#CC9B40';
                    }
                }
            })
                .on("click", function (e) {
                    var tooltip = d3.selectAll(".tooltip");
                    // 判断是否存在
                    if (!tooltip.empty()) {
                        // 存在则删除
                        d3.select(".tooltip").remove();
                    }
                    else {
                        // 不存在则创建
                        // 确定当前国家，并获取该国家对应的获奖者信息数组
                        var country = d3.select(this).attr("country");
                        var info_list = [];
                        for (var i = 0; i < country_count.length; i++) {
                            var _country = country_count[i]['country'];
                            if (country == _country) {
                                info_list = country_count[i]['info'];
                            }
                        }
                        // 浮窗元素
                        var tooltip = d3.select("#page2")
                            .append("div")
                            .attr("class", "tooltip")
                            .style("position", "absolute")
                            .style("top", 1.1 * getWindowHeight)
                            .style("left", 0.1 * getWindowWidth)
                            .style("width", "100%")
                            // .style("background-color","white")
                            .style("border-radius", "20px");
                        var title = tooltip.append("p")
                            .attr("class", "country")
                            .style("font-size", "40px")
                            .style("text-align", "center")
                        var show = tooltip.append("div")
                            .style("display", "flex")
                            .style("flex-wrap", "wrap")
                            .style("justify-content", "space-between")
                            .style("align-items", "center");
                        title.text(country);

                        for (var i = 0; i < info_list.length; i++) {
                            var info = info_list[i];
                            var sub_tooltip = show.append("div")
                                .attr("class", "sub tooltip")
                                .attr("width", "25%")
                                .style("margin-left", "40px")
                                .style("margin-right", "40px")
                                .style("margin-top", "40px")
                                .style("margin-bottom", "25px");
                            var tooltipAvatar = sub_tooltip.append("img").attr("class", "laureate avatar");
                            var tooltipName = sub_tooltip.append("p").attr("class", "laureate name");
                            var tooltipYear = sub_tooltip.append("p").attr("class", "laureate year");
                            var tooltipField = sub_tooltip.append("p").attr("class", "laureate field");
                            // 更新浮窗内容
                            tooltipAvatar.attr("src", info['link']);
                            tooltipName.text("Name: " + info['name']);
                            tooltipYear.text("Prize Year: " + info['year']);
                            tooltipField.text("Prize Field: " + info['field']);
                        }
                    }
                });

            //从筛选后的数据获取 机构-机构位置-获奖人数 数据
            var ins_count = [];
            for (var i = 0; i < target_list.length; i++) {
                ins = target_list[i]['ins'];
                if (ins != '') {
                    var flag = 0;
                    for (var j = 0; j < ins_count.length; j++) {
                        if (ins == ins_count[j]['ins']) {
                            ins_count[j]['count'] += 1;
                            flag = 1;
                        }
                    }
                    if (flag == 0) {
                        var raw_loc = target_list[i]['city loc'];
                        var lon = Number(raw_loc.slice(1, -1).split(",")[0]);
                        var lat = Number(raw_loc.slice(1, -1).split(",")[1]);
                        var loc = [lat, lon];
                        ins_count.push({ 'ins': ins, 'count': 1, 'loc': loc });
                    }
                }
            }

            // 求要展示的属性的最大值和最小值
            var maxvalue = d3.max(ins_count, function (d) {
                return d['count'];
            });
            var minvalue = d3.min(ins_count, function (d) {
                return d['count'];;
            });
            var num_scale = d3.scaleLinear()
                .domain([minvalue, maxvalue])
                .range([1, 4]);
            //经纬度投影函数
            var coor = function (d) {
                // 获取经纬度
                var lat_lon = d['loc'];
                // 转为映射在地图上的坐标
                var coordinate = projection(lat_lon);
                return coordinate;
            };

            //显示得过诺奖的机构位置
            const circles = map_svg.selectAll('circle')
                .data(ins_count)
                .join("circle")
                .attr("class", "point")
                .attr("cx", function (d) {
                    if (coor(d)[0] == NaN) console.log(d);
                    return coor(d)[0];
                })
                .attr("cy", function (d) {
                    return coor(d)[1];
                })
                .attr("fill", "white")
                .attr("r", function (d) {
                    var num = d['count'];
                    return num_scale(num);
                })
                .on("mouseover", function () {
                    d3.select(this).attr('opacity', 0.5);
                })
                .on("mouseout", function () {
                    d3.select(this).attr('opacity', 1);
                });

            //地图缩放、拖动功能
            function zoomed({ transform }) {
                var g = map_svg.selectAll('g')
                g.attr("transform", transform);
                // 更新点的位置和大小
                circles.attr("transform", transform);
            }

            var zoom = d3.zoom()
                .extent([[0, 0], [648, 480]]) //平移范围
                .scaleExtent([0.2, 2.5]) //缩放大小倍数
                .on("zoom", zoomed);

            map_svg.call(zoom);

            map_svg.call(zoom.transform, d3.zoomIdentity.scale(0.5).translate(350, 400));


        });
    }

    //调用绘图函数
    draw_map(start_year, end_year);


    //添加绘制时间进度条的svg
    const time_svg = d3.select("#main")
        .append("svg")
        .attr('width', 0.9 * getWindowWidth())
        .attr('height', 0.18 * getWindowHeight())
        .style("margin-left", 0.05 * getWindowWidth())
        .style("z-index", 99);
    const time_width = time_svg.attr("width");
    const time_height = time_svg.attr("height");

    // 添加时间进度条
    const time_line_left = 0.05 * time_width;
    const time_line_right = 0.95 * time_width;
    const time_line_height = 0.5 * time_height;
    // 添加时间文字
    time_svg.append("text")
        .attr("x", 0.03 * time_width)
        .attr("y", 0.7 * time_height)
        .attr('font-size', 24)
        .attr("fill", "white")
        .text('1902')
        .classed("linear-text", true);
    time_svg.append("text")
        .attr("x", 0.93 * time_width)
        .attr("y", 0.7 * time_height)
        .attr('font-size', 24)
        .attr("fill", "white")
        .text('2016')
        .classed("linear-text", true);
    // 添加时间轴
    time_svg.append("line")
        .attr("x1", time_line_left)
        .attr("y1", time_line_height)
        .attr("x2", time_line_right)
        .attr("y2", time_line_height)
        .attr("stroke", "white")
        .attr("stroke-width", "4px");
    // 时间比例尺
    var time_ticks_scale = d3.scaleLinear()
        .domain([1902, 2016])
        .range([time_line_left + 2, time_line_right - 2]);
    // 添加时间轴的标签和中间部分的文字
    for (var i = 1901; i < 2016; i++) {
        var posi = time_ticks_scale(i + 1);
        if ((i - 1901) % 19 == 0) {
            time_svg.append("line")
                .attr("x1", posi)
                .attr("y1", time_line_height)
                .attr("x2", posi)
                .attr("y2", 0.9 * time_line_height)
                .attr("stroke", "white")
                .attr("stroke-width", "4px");
            if (i != 1901 && i != 2015) {
                time_svg.append("text")
                    .attr("x", posi - 0.02 * time_width)
                    .attr("y", 0.7 * time_height)
                    .attr('font-size', 24)
                    .attr("fill", "white")
                    .text(String(i + 1))
                    .classed("linear-text", true);
            }
        }
        else {
            time_svg.append("line")
                .attr("x1", posi)
                .attr("y1", time_line_height)
                .attr("x2", posi)
                .attr("y2", 0.95 * time_line_height)
                .attr("stroke", "white")
                .attr("stroke-width", "4px");
        }
    }

    // 添加可拖动的矩形
    const rect_width = 0.015 * time_width;
    const rect_height = 0.12 * time_height;
    const rect_left = time_svg.append("rect")
        .attr("x", time_line_left - 0.5 * rect_width)
        .attr("y", time_line_height - 0.5 * rect_height)
        .attr("width", rect_width)
        .attr("height", rect_height)
        .attr("fill", "#cc9b40")
        .attr("fill-opacity", 0.9)
        .attr("stroke", "black")
        .attr("stroke-width", "1px")
        .attr("id", "rect_left");
    const rect_right = time_svg.append("rect")
        .attr("x", time_line_right - 0.5 * rect_width)
        .attr("y", time_line_height - 0.5 * rect_height)
        .attr("width", rect_width)
        .attr("height", rect_height)
        .attr("fill", "#cc9b40")
        .attr("fill-opacity", 0.9)
        .attr("stroke", "black")
        .attr("stroke-width", "1px")
        .attr("id", "rect_right");

    // 拖动函数
    var drag_left = d3.drag()
        .on('start', function (e) {
            d3.select(this).attr('stroke', 'black')
        })
        .on('drag', function (e) {
            var rect = d3.select(this);
            // console.log(d3.select(this).attr("id"));
            var another_rect_x = d3.select("#rect_right").attr('x');
            rect.attr('x', function () {
                var x_now = Number(rect.attr('x')) + e.dx;
                if (x_now <= (time_line_left - 0.5 * rect_width)) {
                    return time_line_left - 0.5 * rect_width;
                }
                else if (x_now >= (time_line_right - 0.5 * rect_width)) {
                    return time_line_right - 0.5 * rect_width;
                }
                if (x_now >= another_rect_x) {
                    return another_rect_x;
                }
                return x_now;
            })
                .attr('x', function () {
                    var x_now = Number(rect.attr('x')) + e.dy;
                    if (x_now <= (time_line_left - 0.5 * rect_width)) {
                        return time_line_left - 0.5 * rect_width;
                    }
                    else if (x_now >= (time_line_right - 0.5 * rect_width)) {
                        return time_line_right - 0.5 * rect_width;
                    }
                    if (x_now >= another_rect_x) {
                        return another_rect_x;
                    }
                    return x_now;
                })
        })
        .on('end', function (e) {
            d3.select(this).attr('stroke', 'black');
            year = Math.round(time_ticks_scale.invert(Number(d3.select(this).attr('x')) + Number(0.5 * rect_width)));
            start_year = year;
            // 重新调用绘图函数
            draw_map(start_year, end_year);
            draw_clouds(start_year, end_year);
        })
    var drag_right = d3.drag()
        .on('start', function (e) {
            d3.select(this).attr('stroke', 'black')
        })
        .on('drag', function (e) {
            var rect = d3.select(this);
            // console.log(d3.select(this).attr("id"));
            var another_rect_x = d3.select("#rect_left").attr('x');
            rect.attr('x', function () {
                var x_now = Number(rect.attr('x')) + e.dx;
                if (x_now <= (time_line_left - 0.5 * rect_width)) {
                    return time_line_left - 0.5 * rect_width;
                }
                else if (x_now >= (time_line_right - 0.5 * rect_width)) {
                    return time_line_right - 0.5 * rect_width;
                }
                if (x_now <= another_rect_x) {
                    return another_rect_x;
                }
                return x_now;
            })
                .attr('x', function () {
                    var x_now = Number(rect.attr('x')) + e.dy;
                    if (x_now <= (time_line_left - 0.5 * rect_width)) {
                        return time_line_left - 0.5 * rect_width;
                    }
                    else if (x_now >= (time_line_right - 0.5 * rect_width)) {
                        return time_line_right - 0.5 * rect_width;
                    }
                    if (x_now <= another_rect_x) {
                        return another_rect_x;
                    }
                    return x_now;
                })
        })
        .on('end', function (e) {
            d3.select(this).attr('stroke', 'black');
            year = Math.round(time_ticks_scale.invert(Number(d3.select(this).attr('x')) + Number(0.5 * rect_width)));
            end_year = year;
            // 重新调用绘图函数
            draw_map(start_year, end_year);
            draw_clouds(start_year, end_year);
        })
    rect_left.call(drag_left);
    rect_right.call(drag_right);


    //添加绘制词云的svg
    const cloud_svg = d3.select("#main")
        .append("svg")
        .attr('width', 0.4 * getWindowWidth())
        .attr('height', 0.6 * getWindowHeight())
        // .style("background-color", "red")
        .style("position", "absolute")
        .style("left", 0.6 * getWindowWidth())
        .style("top", 0.15 * getWindowHeight());
    // .style("position","fixed")
    const cloud_width = cloud_svg.attr("width");
    const cloud_height = cloud_svg.attr("height");

    function draw_clouds(start_year, end_year) {

        d3.csv("data/words_count.csv").then(function (data) {

            // 根据年份范围筛选数据
            var phy_list = [];
            var che_list = [];
            var med_list = [];
            for (var i = 0; i < data.length; i++) {
                year = Number(data[i]['year']);
                if (year >= start_year && year <= end_year) {
                    var field = data[i]['field'];
                    if (field == 'physics') { phy_list.push(data[i]); }
                    else if (field == 'chemistry') { che_list.push(data[i]); }
                    else { med_list.push(data[i]); }
                }
            }

            // 数量筛选，取频次前limit的词展示
            var limit = 5;
            if (phy_list.length > limit) {
                phy_list = phy_list.sort(function (a, b) {
                    return b.size - a.size;
                })
                var sorted_phy_list = phy_list.slice(0, limit);
            }
            else { var sorted_phy_list = phy_list; }

            if (che_list.length > limit) {
                che_list = che_list.sort(function (a, b) {
                    return b.size - a.size;
                })
                var sorted_che_list = che_list.slice(0, limit);
            }
            else { var sorted_che_list = che_list; }

            if (med_list.length > limit) {
                med_list.sort(function (a, b) {
                    return b.size - a.size;
                })
                var sorted_med_list = med_list.slice(0, limit);
            }
            else { var sorted_med_list = med_list; }

            // 合并三个领域的前limit个高频词
            var result_list = sorted_phy_list.concat(sorted_che_list, sorted_med_list);
            // console.log(result_list);

            // 创建词云布局
            var layout = d3.layout.cloud()
                .size([cloud_width, cloud_height])
                .words(result_list)
                .padding(15)
                // .rotate(function() { return ~~(Math.random() * 2) * 90; })
                .rotate(0)
                .fontSize(function (d) { return 20 * d.size; })
                .on("end", draw);

            // 绘制词云
            layout.start();

            // console.log(layout);

            // 绘制词云函数
            function draw(words) {
                cloud_svg.selectAll("svg").remove();
                cloud_svg.append("svg")
                    .attr("class", "cloud_svg")
                    .attr("width", layout.size()[0])
                    .attr("height", layout.size()[1])
                    .append("g")
                    .attr("transform", "translate(" + 0.5 * layout.size()[0] + "," + 0.5 * layout.size()[1] + ")")
                    .selectAll("text")
                    .data(words)
                    .enter()
                    .append("text")
                    .style("font-size", function (d) { return 0.5 * d.size; })
                    // .style("font-family", "Impact")
                    .style("fill", "#cc9b40")
                    .attr("text-anchor", "middle")
                    .attr("transform", function (d) {
                        return "translate(" + [d.x, d.y] + ")rotate(" + d.rotate + ")";
                    })
                    .text(function (d) { return d.text; });
            }
        })

    }

    //调用词云绘图函数
    draw_clouds(start_year, end_year);
}


function showPage3() {
    newPage();
    addHeader("Reward of Diligency: Length and Intervals to Achieve Nobel Prize");

    const blockWidth = WIDTH / 3 - 10;
    const blockHeight = HEIGHT * 0.95;

    var tooltip = d3.select("body")
        .append("div")
        .attr("class", "tooltip")
        .style("position", "absolute")
        .style("visibility", "hidden");

    var tooltipAvatar = tooltip.append("img").attr("class", "laureate avatar");
    var tooltipName = tooltip.append("p").attr("class", "laureate name");
    var tooltipPrizeYear = tooltip.append("p").attr("class", "laureate year");
    var tooltipStudy = tooltip.append("p").attr("class", "laureate study");
    var tooltipGap = tooltip.append("p").attr("class", "laureate gap");

    // TODO: 不扩展窗口大小的自适应
    function drawBlock(blockId, blockCategory, blockData, blockText) {
        var block = d3.select("#page").append("div").attr("class", "block").attr("id", "block"+blockId);
        block.append("span").attr("class", "subject").text(blockText);
        block.append("svg").attr("id", blockCategory).attr("height", 0).attr("width", 0).attr("class", "graph").on("mouseover", "hoverBlock(0)").on("mouseover", "clearAnimation()");
        
         // resizing the svg
        var svg = d3.select("#"+blockCategory);
        svg.attr("width", blockWidth);
        svg.attr("height", blockHeight);

        const r = 35;
        const centerX = blockWidth / 2
        const centerY = blockHeight / 2

        
        // add central Nobel image
        svg.append("image")
        .attr("xlink:href", "nobel.png") 
        .attr("x", centerX - r)
        .attr("y", centerY - r)
        .attr("width", 2 * r)
        .attr("height", 2 * r);

        

    
    }

    drawBlock(1, "ch", "", "CHEMISTRY")

    // Chemistry
   



    // read csv file
    d3.csv("data/ch_year.csv").then(function (data) {
        const lineLengths = data.map(x => Number(x.study_year))
        const circleRadii = data.map(x => Number(x.award_gap))
        const nobelname = data.map(x => x.LaureateName0)

        const lineCount = data.length;

        // 定义比例尺
        const scale1 = d3.scaleLinear()
            .domain([1, 112])
            .range([45, centerX_CH - r]);

        const scale2 = d3.scaleLinear()
            .domain([1, 56])
            .range([1, 8]);

        // 线段
        const lines = svg1.selectAll("line")
            .data(lineLengths)
            .enter()
            .append("line")
            .attr("x1", (d, i) => {
                const angle = (2 * Math.PI * i) / lineCount;
                return centerX_CH + r * Math.cos(angle);
            })
            .attr("y1", (d, i) => {
                const angle = (2 * Math.PI * i) / lineCount;
                return centerY_CH + r * Math.sin(angle);
            })
            .attr("x2", (d, i) => {
                const angle = (2 * Math.PI * i) / lineCount;
                const lineLength = scale1(d);
                return centerX_CH + (lineLength) * Math.cos(angle);
            })
            .attr("y2", (d, i) => {
                const angle = (2 * Math.PI * i) / lineCount;
                const lineLength = scale1(d);
                return centerY_CH + (lineLength) * Math.sin(angle);
            })
            .attr("stroke", "rgba(230, 139, 184, 0.8)");

        // 绘制连接线段的圆，并设置半径为 z 值
        const circles = svg1.selectAll("circle")
            .data(circleRadii)
            .enter()
            .append("circle")
            .attr("index", (d, i) => i)
            .attr("cx", (d, i) => {
                const angle = (2 * Math.PI * i) / lineCount;
                const lineLength = scale1(lineLengths[i]); // 应用线段长度的比例尺
                return centerX_CH + (lineLength) * Math.cos(angle);
            })
            .attr("cy", (d, i) => {
                const angle = (2 * Math.PI * i) / lineCount;
                const lineLength = scale1(lineLengths[i]); // 应用线段长度的比例尺
                return centerY_CH + (lineLength) * Math.sin(angle);
            })
            .attr("r", d => scale2(d)) // 设置圆的半径为 z 值
            .attr("class", "circle-ch")
            .attr("data_length", (d, i) => lineLengths[i])
            .attr("data_gap", (d) => d)
            .style("opacity", 0.5) // 初始时将圆的透明度设为0.5，隐藏标签
            // 设置浮窗
            .on("mouseover", function () {
                i = d3.select(this).attr("index");
                // 更改透明度
                d3.select(this).style("opacity", 1)
                var study_year = d3.select(this).attr("data_length");
                var award_gap = d3.select(this).attr("data_gap");
                // 更新浮窗内容和位置
                tooltipAvatar.attr("src", data[i].photo_link);
                tooltipName.text(data[i].LaureateName0);
                tooltipPrizeYear.text("Prize Year: " + data[i].prize_year);
                tooltipStudy.text("Length of Study: " + data[i].study_year);
                tooltipGap.text("Years to be Awarded: " + data[i].award_gap);
                tooltip.style("visibility", "visible")
                    .style("top", (event.pageY - 10) + "px")
                    .style("left", (event.pageX + 10) + "px");
            })
            .on("mouseout", function () {
                d3.select(this)
                    .style("opacity", 0.5); // 鼠标离开时将圆的透明度设为0，隐藏标签
                tooltipAvatar.attr("src", "");
                tooltip.style("visibility", "hidden");
            })
    });


    d3.select('#page').append("div").attr("class", "legend").append('svg').attr('id', "legend").attr("width", 450)




}


function showPage5() {
    // 清空画布
    d3.select("#page").selectAll("*").remove();

    var ending = d3.select("#page").append("div").attr("class", "ending")
    ending.append("p").attr("class", "end").text("A hundred vessels contend, a thousand sails compete,")
    .append("p").attr("class", "end").text("as mankind's ceaseless march towards truth knows no retreat.")
    .append("p").attr("class", "end").text("The history of Nobel yet unfolds, with tales yet to be complete.")
}



function hoverBlock(index) {
    var blocks = document.getElementsByClassName("graph");
    
    // 添加活动样式
    blocks[index].classList.add("active");
    
    // 移除非活动样式
    for (var i = 0; i < blocks.length; i++) {
      if (i !== index) {
        blocks[i].classList.add("inactive");
        blocks[i].classList.remove("active");
      }
    }
    
    // 根据索引应用相应的移动样式
    if (index === 0) {
      blocks[index].classList.add("move-left");
      blocks[index+1].classList.add("move-center");
      blocks[index+2].classList.add("move-right");
    } else if (index === 1) {
      blocks[index-1].classList.add("move-left");
      blocks[index].classList.add("move-center");
      blocks[index+1].classList.add("move-right");
    } else if (index === 2) {
      blocks[index-2].classList.add("move-left");
      blocks[index-1].classList.add("move-center");
      blocks[index].classList.add("move-right");
    }
  }

function clearAnimation() {
    var blocks = document.querySelectorAll(".graph");
    blocks.forEach((elem) => {
        elem.classList = "graph"
    })
}