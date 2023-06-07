// 获取画布的大小
function getWindowWidth() {
    return window.innerWidth || document.documentElement.clientWidth || document.body.clientWidth
}
function getWindowHeight() {
    return window.innerHeight || document.documentElement.clientHeight || document.body.clientWidth
}

//添加绘制地图的svg
const margin = { top: 60, bottom: 60, left: 60, right: 60 }
const map_svg = d3.select("#main")
    .append("svg")
    .attr('width', 0.6 * getWindowWidth())
    .attr('height', 0.8 * getWindowHeight())
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
            .scaleExtent([0.4, 1.2]) //缩放大小倍数
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
    // .style("background-color", "red")
    .style("margin-left", 0.05 * getWindowWidth());
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