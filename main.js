var Crawler = require("crawler");
var fs = require('fs');
var json2csv = require('json2csv');

var list = [];

var c = new Crawler({
    maxConnections: 10,
    // This will be called for each crawled page 
    'callback': function (error, res, done) {
        if (error) {
            console.log(error);
        } else {
            var $ = res.$, tasks = [];

            $('#bc1 .fk_list a.fl').each(function (i) {
                var $me = $(this), url = $me.attr('href');
                tasks.push(promiseGetDetail(url));
            });
            Promise.all(tasks).then(function (results) {
                results.forEach(function (res) {
                    var $ = res.$;
                    pickFieldsToList($);
                });

                var fields = ['pic', 'name', 'tag', 'other', 'title', 'birthYear', 'birthMonth', 'gender',
                    'province', 'place', 'people', 'school', 'degree', 'education', 'experience'];

                saveAsCSV(list, fields);

                console.log('all detail info returned');
            }).catch(function (err) {
                console.error(err);
            })
        }
        done();
    }
});

// Queue just one URL, with default callback 
c.queue('http://renwuku.news.ifeng.com/list/lastname');

var pickFieldsToList = function ($) {
    var $tag = $('.rw_word h1 a').eq(1),
        $li = $('.rw_word ul li'),
        birth = $li.first().find('span').text().split('-');
    var item = {
        pic: $('.rw_pic img').attr('src'),
        name: $('.rw_word h1 a:first-child').text(),
        tag: $tag.length ? $tag.attr('title') : '',
        other: $('.rw_word h1 span').text(),
        title: $('.rw_word p').text(),
        birthYear: birth[0],
        birthMonth: birth[1],
        gender: $li.eq(1).text().split('：')[1].trim(),
        province: $li.eq(2).find('a').text(),
        place: $li.eq(2).text().split('：')[1].trim(),
        people: $li.eq(3).find('a').text(),
        school: $li.eq(4).find('a').text(),
        degree: $li.eq(5).find('a:first-child').text(),
        education: $li.eq(5).find('a:last-child').text(),
        experience: $('.zyjl_content').text()
    };
    list.push(item);
};

var promiseGetDetail = function (url) {
    return new Promise(function (resolve) {
        try {
            c.queue([{
                uri: url,
                'callback': function (error, res, done) {
                    if (error) {
                        console.log(error);
                        resolve(error);
                    } else {
                        resolve(res);
                    }
                    done();
                }
            }]);
        } catch (err) {
            console.error(err);
            resolve(err);
        }
    })
};

var saveAsCSV = function (data, fields) {
    var option = {
        fields: fields,
        fieldNames: fields,
        data: data,
        quotes: '"'
    };

    var csvStr = json2csv(option);

    var buffer = Buffer.concat([new Buffer('\xEF\xBB\xBF', 'binary'), new Buffer(csvStr)]);
    fs.writeFile('exportfile.csv', buffer, function (err) {
        if (err) throw err;
        console.log('file saved');
    });
};