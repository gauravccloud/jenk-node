'use strict';
(function(){
    var allAssetCategories = [];
    var pageNumber = 0;
    var pageSize = 4;
    var infiniteScrollDisabled = false;
    var banner_category = [];
    var isBannerFetched = false;
    var homePageId = "SONYHOME";
    var configPage = "config_pages";
    var configAds = "config_ads";
    var configBands = "config_bands";
    var metadatas = [];
    var custombanner = [];
    var allMastheads = [];
    var banners = [];
    var mastHeadBanner = [];
    var emptyRailsCount = 0;
    var xdrAssetIndex = 0;
    var assetsByCategory = [];
    var initialLoading = false;
    function getAllBands() {
        return new Promise(function(resolve,reject) {
            var url = 'https://sony.cognitiveclouds.com/api/configuration/config_pages';
            var pageId = pageId ? pageId : homePageId;
            fetch(url, { method: 'GET' })
            .then(function(fetchResponse){ return fetchResponse.json() })
            .then(function(res) {
                var pageConfigs = res["config_pages"];
                var allAssetCategories = { "carousel": [], "custombanner":[]};
                for(var i=0;i<pageConfigs.length;i++) {
                    if(pageConfigs[i].id.toLowerCase() === pageId.toLowerCase()) {
                        sectionDetails(pageConfigs[i].bands,"config_bands_ads").then(function(data) {
                            allAssetCategories["bands"] = data.filter( obj => {
                                if (obj.type === 'recosense') {
                                    var pagename = (homePageId === 'SONYHOME') ? 'home' : 'custompage';
                                    if (obj.data && !(obj.data.indexOf('page_id') > -1)) {
                                        obj.data = obj.data + '&' + 'page_id=' + pagename;
                                    }
                                }
                                if (obj.template === 'banner') {
                                    allAssetCategories["carousel"].push(obj);
                                    return false;
                                }
                                if (obj.template === 'custombanner') {
                                    if (obj.data && obj.data !== '' && obj.data.indexOf('asset://') > -1) {
                                        obj.image_url = '/asset/assetUrl/'+obj.data.split('://')[1];
                                    } else {
                                        obj.image_url = "http://" + 'h_480,w_1280,c_fill/' + obj.image_url;
                                    }
                                    allAssetCategories["custombanner"].push(obj);
                                    return false;
                                }
                                return true;
                            })
                            resolve(allAssetCategories);
                        })
                    }
                }
            })
        });
    }

    function sectionDetails(bands, key) {
        var itemList = [];
        return new Promise(function(resolve, reject){
            if(key === "config_bands_ads") {
                getConfigBands("config_bands").then(function(AppgridBandSectionObjects){
                    getConfigBands("config_ads").then(function(AppgridAdSectionObjects) {
                        bands.forEach(function(sectionId)  {
                            if(sectionId.bandType === "ad") {
                                AppgridAdSectionObjects["config_ads"].forEach(singleAppgridSectionObject => {
                                    if(singleAppgridSectionObject.uniqueId.toUpperCase() ==sectionId.id.toUpperCase()) {
                                        singleAppgridSectionObject.type = 'googleAd';
                                        itemList.push(singleAppgridSectionObject);
                                    }
                                })
                            } else {
                                AppgridBandSectionObjects['config_bands'].forEach(function(singleAppgridSectionObject) {
                                    if(singleAppgridSectionObject.id.toUpperCase() ==sectionId.id.toUpperCase()) {
                                        itemList.push(singleAppgridSectionObject);
                                    }
                                });
                            }
                        });
                        resolve(itemList);
                    })
                })
            }
        })
    }

    function getConfiguration() {
        getAllBands().then(function(configurations){
            allAssetCategories = configurations["bands"].map(function(item) {
                if(item.type === 'googleAd'){
                  item.data = 'nodata';
                }
                return item;
            }.bind(this));
            banner_category = configurations["carousel"];
            metadatas = configurations.metadata;
            if(configurations["custombanner"]) {
                custombanner = configurations["custombanner"];
                allMastheads = custombanner;
            }
            getContentPage();
        })
    }

    getConfiguration()

    function getConfigBands(key) {
        var baseUrl = "https://sony.cognitiveclouds.com";
        var cacheKey = "";
        var opts = {
          cacheKey: cacheKey + ':' + key,
          url: '/api/configuration/' + key
        }
        var url = baseUrl + opts.url;
        return new Promise(function(resolve,reject) {
            fetch(url, { method: 'GET' })
            .then(function(fetchResponse){ return fetchResponse.json() })
            .then(function(response) {
                resolve(response);
            })
        });
    };
    
    function getContentPage() {
        partialLoading(allAssetCategories).then(function(categories) {
            populateDataForMultipleBands(categories).then(function(categoryList){
                var resultAfterBannerFilter = categoryList.filter(function (obj) {
                    if (obj.displayOptions.template === 'banner') {
                    if(obj.display_data && obj.display_data[0] && obj.display_data[0].image && obj.displayOptions.type !== 'googleAd') {
                        allMastheads = (obj.display_data) ? allMastheads.concat(obj.display_data) : allMastheads;
                    }
                        banners = allMastheads;
                        mastHeadBanner =  Object.assign({},banners);
                        return false;
                    }
                        return true;
                }.bind(this))
                var xdrPosition = -1;
                var hasXDRAsset = false;
                resultAfterBannerFilter.forEach(function(railData, index){
                      if(railData && railData.display_data && railData.display_data.length){
                        emptyRailsCount--;
                      }
                      if(emptyRailsCount >= 0){
                        xdrPosition++;
                      }
                      if(railData.displayOptions.type === 'xdr'){
                        xdrAssetIndex = index;
                        hasXDRAsset = true;
                      }
                }.bind(this));
                xdrPosition = hasXDRAsset ? xdrPosition : xdrPosition + 1;
                if(resultAfterBannerFilter.length){
                    resultAfterBannerFilter = positionXDRRails(resultAfterBannerFilter, xdrPosition);
                }
                if(resultAfterBannerFilter.length) {
                    resultAfterBannerFilter.forEach(function(rail, index) {
                        if(rail.displayOptions && rail.displayOptions.sponsorLogo) {
                            if(rail.display_data && Array.isArray(rail.display_data) && rail.display_data.length) {
                                var newAsset = Object.assign({},rail.display_data[0]);
                                newAsset.action = rail.displayOptions.sponsorURL;
                                newAsset.image = rail.displayOptions.sponsorPortail;
                                newAsset.image_landscape = rail.displayOptions.sponsorThumbnail;
                                newAsset.title = '';
                                newAsset.duration = null;
                                newAsset.type = 'sponsorAd';
                                newAsset.isPremiumType = false;
                                newAsset.subscriptionMode = 'FREE';
                                resultAfterBannerFilter[index]["display_data"].unshift(newAsset);
                            }
                        }
                    }.bind(this));
                }
                console.log('--- result after banner filter ---', resultAfterBannerFilter);
                assetsByCategory = (assetsByCategory || []).concat(resultAfterBannerFilter);
                pageNumber += 1;
                if(assetsByCategory.length) {
                    initialLoading = false;
                }
                if(emptyRailsCount > 0 && categoryList.length) {
                    loading = true;
                    getContentPage();
                } else if(emptyRailsCount > 0 && !categoryList.length) {
                    infiniteScrollDisabled = true;
                    showRefreshScreen = true;
                }
            })
        })
    };

    function partialLoading(data) {
        return new Promise(function(resolve, reject){
                var begin = pageNumber * pageSize;
                var end = begin + pageSize;
                if (begin >= allAssetCategories.length) {
                    infiniteScrollDisabled = true;
                }
                resolve(data.slice(begin,end));
            })
    };

    function populateDataForMultipleBands(categories, bannerCategories) {
        if(banner_category && !isBannerFetched) {
            var bannerMastheads =[];
            bannerMastheads = categories;
            categories = bannerMastheads.concat(banner_category);
            isBannerFetched = true;
        }

        return new Promise(function(resolve, reject) {
            populateDataForMultipleBandsService(categories).then(function(response) {
                resolve(response);
            })
        })

    };

    function navigationBasedOnAction(action, assetDetails,isWrongAssetIdForPromotion) {
          var assetId = '';
          var actionValue = '';
          var internalPageIds = ['selectPack', 'packSelection','watchlater','watch_later', 'follow', 'favorites', 'continue_watching', 'xdr', 'purchase_items', 'purchaseHistory'];
          if(action){
            var splitAction = action.split('?');
            actionValue = splitAction[0];
          }
          if (!actionValue) { // No action set in appgrid action field.
            this.assetNavigation(action, null, assetDetails);
          } else if (actionValue.indexOf('sony://asset') > -1) {
             if(isWrongAssetIdForPromotion){
               assetId = action.split('sony://asset/')[1] || '';
               this.assetNavigation(action, assetId, assetDetails);
               return;
            }
            assetId = action.split('sony://asset/')[1] || '';
            this.assetNavigation(action, assetId, assetDetails);
          } else if (actionValue.indexOf('sony://player') > -1) {
            assetId = action.split('sony://player/')[1] || '';
            this.assetNavigation(action, assetId, assetDetails);
          } else if (actionValue.indexOf('sony://details') > -1) {
            assetId = action.split('sony://details/')[1] || '';
            this.assetNavigation(action, assetId, assetDetails);
          }/*Todo: Need to remove on 1b. For the time being it just for backward compatibility.
           This should be same as mobile patforms.
           */
          else if (actionValue.indexOf('sony://page/custompage') > -1) {
            assetId = action.split('sony://page/custompage/')[1] || '';
            this.assetNavigation(action, assetId, assetDetails,'customPage');

          } else if (actionValue.indexOf('sony://page') > -1) { // for custom pages and internal pages

            var schemaSplit = actionValue.split('sony://page/');
            var pageId = schemaSplit[1] || null;
            if (pageId && internalPageIds.indexOf(pageId) > -1) {//navigate to internal page
              var internalPath = findInternalPage(pageId);
            //   this.location.path("internalPath");
            } else { //custom page navigation
              assetId = action.split('sony://page/')[1] || '';
              this.assetNavigation(action, assetId, assetDetails,'customPage');
            }

          }else if (actionValue.indexOf('sony://promotion/') > -1) {
            //sony://promotion/<subscriptionMode>/<contentId>/<coupon_code>?redirectSchema=”<redirectSchema>”
            var path = action.slice(17);
            ///promotion/SVOD/test_india
            this.assetNavigation(path, null, assetDetails,'promotion');
          }
          /*Todo: Need to remove on 1b. In the time being it just for backward compatibility.
           This should be same as mobile patforms.
           */
          else if (actionValue.indexOf('sony://listing/asset') > -1) {
            assetId = action.split('sony://listing/asset/')[1] || '';
            this.assetNavigation(action, assetId, assetDetails,'listingPage');
          } else if (actionValue.indexOf('sony://listing') > -1) {
            assetId = action.split('sony://listing/')[1] || '';
            this.assetNavigation(action, assetId, assetDetails,'listingPage');

          } else if (action.indexOf('sony://webview/') > -1) {//webview navigation
            var action = action.split('sony://webview/')[1] || '';
            window.location.href = action;
          } else if (action.indexOf('dplnk?schema') > -1) {//deeplink
            window.location.href = action;
          } else if (actionValue.indexOf('http://') > -1 || actionValue.indexOf('https://') > -1 ) {
            window.open(action);
          }
          else if( actionValue.indexOf('sony://internal') > -1 ) {//to handle any other internal routes
            // $location.path(action.replace('sony://internal',''));
          }
          return;
    }
    
    function populateDataForMultipleBandsService(categories,asset) {
        var req_param = {};
        req_param["searchSet"] = [];
        var categorySearchResult = [];
        var customBandsResult = [];
        var RAILS_TYPE = {
          FILTER: 'customfilter',
          SEASON: 'season',
          RECOSENSE: 'recosense',
          APPGRID: 'appgrid'
        };
        var CLOUDINARY_BASE_URL = "http://resources.sonyliv.com/image/fetch/";
        var CLOUDINARY_SCALE_TYPE = "c_fill,fl_lossy,f_auto,q_80,e_contrast:30,e_brightness:10";
        var queryOptions = {};
        return new Promise(function(resolve, reject) {
            categories.forEach(function(category) {
                if(category.type === "RAILS_TYPE.FILTER)") {
                    queryOptions = {"type":"search","pageSize":10,"pageNumber": 0,"id":category.bandId,"sortOrder":'START_DATE:DESC'}
                    queryOptions["data"] = 'exact=true&all=type:' + (category.sortingField || '') + '&all=showname:' + (asset.showname || '');
                    req_param["searchSet"].push(queryOptions);
                    category.template = 'landscape';
                    if(category.sponsorThumbnail) {
                        var ecodedImageURL = encodeURIComponent(category.sponsorThumbnail);
                        category.sponsorThumbnail = CLOUDINARY_BASE_URL+'h_254,'+CLOUDINARY_SCALE_TYPE+'/'+ecodedImageURL;
                        category.sponsorPortail = CLOUDINARY_BASE_URL+'h_254,w_210,'+ CLOUDINARY_SCALE_TYPE+'/'+ecodedImageURL;
                    }
                    categorySearchResult.push({queryOptions: queryOptions, displayOptions: category});
                } else if(category.type == RAILS_TYPE.RECOSENSE) {
                    queryOptions = {"type": category.type,"pageSize": category.count,"pageNumber": 0,"id": category.id,"sortOrder": category.sort};
                    if(asset && asset.id) {
                        queryOptions["data"] = (category.data) ? category.data + '&item_id=' + asset.id : 'item_id=' + asset.id;
                    } else {
                        queryOptions["data"] = category.data;
                    }
                    req_param["searchSet"].push(queryOptions);
                    if(category.sponsorThumbnail) {
                        var ecodedImageURL = encodeURIComponent(category.sponsorThumbnail);
                        category.sponsorThumbnail = CLOUDINARY_BASE_URL+'h_254,'+CLOUDINARY_SCALE_TYPE+'/'+ecodedImageURL;
                        if(category.template === 'portrait') {
                        category.sponsorPortail = CLOUDINARY_BASE_URL+'h_315,w_210,'+CLOUDINARY_SCALE_TYPE+'/'+ecodedImageURL;
                        } else {
                        category.sponsorPortail = CLOUDINARY_BASE_URL+'h_254,w_210,'+CLOUDINARY_SCALE_TYPE+'/'+ecodedImageURL;
                        }
                    }
                    categorySearchResult.push({queryOptions: queryOptions, displayOptions: category});
                } else {
                    queryOptions = { "data": category["data"],"type": category.type,"action": category.action || '',"pageSize": category.count || 1,"pageNumber": 0,"id": category.id || category.uniqueId,"sortOrder": category.sort || ''};
                    req_param["searchSet"].push(queryOptions);
                    if(category.sponsorThumbnail) {
                        var ecodedImageURL = encodeURIComponent(category.sponsorThumbnail);
                        category.sponsorThumbnail = CLOUDINARY_BASE_URL+'h_254,'+CLOUDINARY_SCALE_TYPE+'/'+ecodedImageURL;
                        if(category.template === 'landscape') {
                            category.sponsorPortail = CLOUDINARY_BASE_URL+'h_254,w_210,'+CLOUDINARY_SCALE_TYPE+'/'+ecodedImageURL;
                        } else {
                            category.sponsorPortail = CLOUDINARY_BASE_URL+'h_315,w_210,'+CLOUDINARY_SCALE_TYPE+'/'+ecodedImageURL;
                        }
                    }
                    categorySearchResult.push({queryOptions: queryOptions, displayOptions: category});
                }
            }, this);
            req_param["detailsType"] = 'basic';
            if(categories.length > 0) {
                VODManagerGetAssetsByCategory(req_param).then(function(data){
                    var position = 0, isRecosenseOptions = false;
                    data.forEach(function (section, index) {
                    var currentCategoryAsset;
                    if(section.type == RAILS_TYPE.RECOSENSE) {
                        if(section.id.indexOf(categorySearchResult[position].displayOptions.id) < 0) {
                            position++;
                        }
                        isRecosenseOptions = true;
                        var recosenseOptions = {};
                        categorySearchResult[position] = Object.assign({}, recosenseOptions);
                        if((section.id != categorySearchResult[position]["displayOptions"].id) || (recosenseOptions["displayOptions"].title == '')) {
                            recosenseOptions["displayOptions"].title = section.railName;
                        }
                        var recoOptions = {
                            "action": recosenseOptions["displayOptions"].action,
                            "template": recosenseOptions["displayOptions"].template,
                            "queryOptions": recosenseOptions["queryOptions"]
                        };
                        recosenseOptions["displayOptions"].seeAllData = section.seeAllData;
                            if(section.is_sponsored === true) {
                                var sponsorAd = section.sponsor_items[0];
                                if(sponsorAd.sponsorThumbnail) {
                                    var ecodedImageURL = encodeURIComponent(sponsorAd.sponsorThumbnail);
                                    var sponsorThumbnail = CLOUDINARY_BASE_URL+'h_254,'+CLOUDINARY_SCALE_TYPE+'/'+ecodedImageURL;
                                    var sponsorPortail = '';
                                    if(recosenseOptions["displayOptions"].template === 'portrait') {
                                    sponsorPortail = CLOUDINARY_BASE_URL+'h_315,w_210,'+CLOUDINARY_SCALE_TYPE+'/'+ecodedImageURL;
                                    } else {
                                    sponsorPortail = CLOUDINARY_BASE_URL+'h_254,w_210,'+CLOUDINARY_SCALE_TYPE+'/'+ecodedImageURL;
                                    }
                                }
                                recosenseOptions["displayOptions"].sponsorPortail = sponsorPortail;
                                recosenseOptions["displayOptions"].sponsorThumbnail = sponsorThumbnail;
                                recosenseOptions["displayOptions"].sponsorLogo = sponsorAd.sponsorLogo;
                                recosenseOptions["displayOptions"].sponsorURL = sponsorAd.sponsorURL;
                                recosenseOptions["displayOptions"].sponsorBG = sponsorAd.sponsorBG;
                            }
                            recosenseOptions["display_data"] = generateAssetListVMOs(section.assets, recoOptions);
                            recosenseOptions["show_rail"] = (recosenseOptions["display_data"] && recosenseOptions["display_data"].length > 0 );
                            customBandsResult.push(recosenseOptions);
                        } else {
                            if(isRecosenseOptions){
                                isRecosenseOptions = false;
                                position++;
                            }
                            currentCategoryAsset = categorySearchResult[position];
                            var options = {
                                action: currentCategoryAsset.displayOptions.action,
                                template: currentCategoryAsset.displayOptions.template,
                                queryOptions: currentCategoryAsset.queryOptions
                            };
                            if (section.assets && section.assets.length > 0 && section.type !== 'googleAd') {
                                if (categorySearchResult[position].displayOptions.type === 'xdr') {
                                    currentCategoryAsset.displayOptions.isOlder = section.isOlder;
                                }
                                if(currentCategoryAsset.displayOptions.type == RAILS_TYPE.FILTER || currentCategoryAsset.displayOptions.type == RAILS_TYPE.SEASON) {
                                    currentCategoryAsset.displayOptions.enableSeeAll = true;
                                    if(section.assets[0]){
                                    currentCategoryAsset.displayOptions.template = getDisplayTemplateFromBCTypes(section.assets[0].type);
                                    }
                                }
                                currentCategoryAsset.display_data = generateAssetListVMOs(section.assets, options);
                            }
                            if (section.type !== 'googleAd') {
                            currentCategoryAsset.show_rail = (currentCategoryAsset.display_data && currentCategoryAsset.display_data.length > 0 );
                            } else {
                            currentCategoryAsset.show_rail = true;
                            }
                            position++;
                            customBandsResult.push(currentCategoryAsset);
                        }
                    })
                    resolve(customBandsResult);     
                })   
            }
        })
    };

    function positionXDRRails(resultAfterBannerFilter, position) {
        var xdrAssetIndex = -1;
        var tempXDRRailObj = '';
        if(resultAfterBannerFilter[xdrAssetIndex] && resultAfterBannerFilter[xdrAssetIndex].displayOptions &&
          resultAfterBannerFilter[xdrAssetIndex].displayOptions.isOlder === false){
          tempXDRRailObj = resultAfterBannerFilter.splice(xdrAssetIndex, 1)[0];
          resultAfterBannerFilter.splice(0, 0, tempXDRRailObj);
          tempXDRRailObj = '';
          xdrAssetIndex = -1;
        } else {
          if(emptyRailsCount > 0 && xdrAssetIndex !== -1){
            if(resultAfterBannerFilter[xdrAssetIndex] && resultAfterBannerFilter[xdrAssetIndex].displayOptions.isOlder){
              tempXDRRailObj = resultAfterBannerFilter.splice(xdrAssetIndex, 1)[0];
            }
          } else if(xdrAssetIndex !== -1 && tempXDRRailObj){
            resultAfterBannerFilter.splice(position, 0, tempXDRRailObj);
            tempXDRRailObj = '';
            xdrAssetIndex = -1;
          } else if(xdrAssetIndex !== -1 && resultAfterBannerFilter[xdrAssetIndex]){
            if(resultAfterBannerFilter[xdrAssetIndex].displayOptions.isOlder){
              tempXDRRailObj = resultAfterBannerFilter.splice(xdrAssetIndex, 1)[0];
              resultAfterBannerFilter.splice(position, 0, tempXDRRailObj);
              tempXDRRailObj = '';
              xdrAssetIndex = -1;
            }
          }
        }
        return resultAfterBannerFilter;
      }


    
      function VODManagerGetAssetsByCategory(params) {
        var searchSet =params.searchSet;
        var containsTypeXDR, containsTypeRecosense;
        var tmpParams = params;
        var cacheKey = "tve:frontend:configuration";
        var baseUrl = "https://sony.cognitiveclouds.com";
        params["deviceDetails"] = {"mfg":"Google Chrome","os":"ios","osVer":"XXX","model":"Google Chrome"};
        var opts = {
          cacheKey: cacheKey + ':category:group:movies' + JSON.stringify(tmpParams),
          url: '/api/v2/vod/search',
          httpOpts: params
        };
        return httpPost((baseUrl+opts.url), params)
    };

    function httpPost(url, data) {
        return new Promise(function(resolve, reject){
            var xmlHttp = new XMLHttpRequest();
            xmlHttp.open("POST", url);
            xmlHttp.setRequestHeader("Content-Type", "application/json;charset=UTF-8");
            xmlHttp.onload = function() {
                if(this.status >= 200 && this.status < 300) {
                    resolve(JSON.parse(xmlHttp.response));
                }
            }
            xmlHttp.send(JSON.stringify(data));
        })
    };

    function httpGet(url, data) {
            return new Promise(function(resolve, reject){
                var xmlHttp = new XMLHttpRequest();
                xmlHttp.open("GET", url);
                xmlHttp.setRequestHeader("Content-Type", "application/json;charset=UTF-8");
                xmlHttp.send(null);
                if (xmlHttp.status == 200) {
                    console.log(xmlHttp.responseText);
                    resolve(xmlHttp.responseText);
                } else {
                    resolve("");
                }
            })
    }

    function generateAssetListVMOs(data, options) {
        var cloudinaryBanner = 'h_480,w_1280', bannerNumber = 0;
        var CLOUDINARY_BASE_URL = "http://resources.sonyliv.com/image/fetch/";
        var CLOUDINARY_SCALE_TYPE = "c_fill,fl_lossy,f_auto,q_80,e_contrast:30,e_brightness:10";
        return data.map(function (value) {
          var assetAction = '';
          var template = '';
          var queryOptions = '';
          var ecodedImageURL = value.thumbnailUrl ?encodeURIComponent(value.thumbnailUrl):'';
          var bannerImageURL = value.posterUrl ?encodeURIComponent(value.posterUrl):'';
          var movieXdrImageURL = value.assetLandscapeImage ? encodeURIComponent(value.assetLandscapeImage):ecodedImageURL;
          if(options){
             assetAction = (options.action)? options.action : '';
             template = (options.template)? options.template : '';
             queryOptions =  (options.queryOptions)? options.queryOptions : {};
          }
          if(template === 'banner' && (bannerNumber === 0)) {
              cloudinaryBanner = 'w_' + ((window.screen.height) + "px" || 1280);
              bannerNumber++;
          }
          var type_show = getBCAssetByType('show');
          return _.defaults(value,{
                action: assetAction,
                template: template,
                queryOptions: queryOptions,
                image: CLOUDINARY_BASE_URL+'h_315,w_210,'+CLOUDINARY_SCALE_TYPE+'/'+ecodedImageURL,
                image_xdr: CLOUDINARY_BASE_URL+'h_254,w_438,'+CLOUDINARY_SCALE_TYPE+'/'+movieXdrImageURL,
                image_landscape:  CLOUDINARY_BASE_URL+'h_254,w_438,'+CLOUDINARY_SCALE_TYPE+'/'+ecodedImageURL,
                image_carousel:  CLOUDINARY_BASE_URL+''+cloudinaryBanner+','+CLOUDINARY_SCALE_TYPE+'/'+bannerImageURL,
                identifier:value.id.toString(),
                duration : (value.duration? (value.duration/60000):0),
                shortDescription:value.shortDesc||'',
                description:value.longDesc||'',
                assetDetailsType:(type_show.indexOf(value.type.toLowerCase())>-1)?'show':value.type.toLowerCase(),
                assetDetailsState:(type_show.indexOf(value.type.toLowerCase())>-1)?'asset.show':'asset.details',
                route_title : value.title?value.title.replace(/ /g,'-'):''
            });
        });
    }

    function getBCAssetByType(type, showString) {
        var bcTypes =  [
            {
                "app_type": "video",
                "band_section_id": "videos_section",
                "bc_type": "Clips",
                "cfg_display_template": "landscape"
            },
            {
                "app_type": "video",
                "band_section_id": "videos_section",
                "bc_type": "Episodes",
                "cfg_display_template": "landscape"
            },
            {
                "app_type": "video",
                "band_section_id": "videos_section",
                "bc_type": "Full Event",
                "cfg_display_template": "landscape"
            },
            {
                "app_type": "video",
                "band_section_id": "videos_section",
                "bc_type": "Full Matches",
                "cfg_display_template": "landscape"
            },
            {
                "app_type": "video",
                "band_section_id": "videos_section",
                "bc_type": "Funny Moments",
                "cfg_display_template": "landscape"
            },
            {
                "app_type": "video",
                "band_section_id": "videos_section",
                "bc_type": "Performances",
                "cfg_display_template": "landscape"
            },
            {
                "app_type": "video",
                "band_section_id": "videos_section",
                "bc_type": "Promos",
                "cfg_display_template": "landscape"
            },
            {
                "app_type": "video",
                "band_section_id": "videos_section",
                "bc_type": "Trailers",
                "cfg_display_template": "landscape"
            },
            {
                "app_type": "show",
                "band_section_id": "LIV_EXCLUSIVE_SECTION",
                "bc_type": "LIV Exclusive",
                "cfg_display_template": "landscape"
            },
            {
                "app_type": "video",
                "band_section_id": "LIVE_SECTION",
                "bc_type": "LIVE",
                "cfg_display_template": "landscape"
            },
            {
                "app_type": "show",
                "band_section_id": "SHOW_SECTION",
                "bc_type": "Event",
                "cfg_display_template": "landscape"
            },
            {
                "app_type": "movie",
                "band_section_id": "MOVIE_SECTION",
                "bc_type": "Full Movie",
                "cfg_display_template": "portrait"
            },
            {
                "app_type": "movie",
                "band_section_id": "MOVIE_SECTION",
                "bc_type": "Short Film",
                "cfg_display_template": "portrait"
            },
            {
                "app_type": "show",
                "band_section_id": "SHOW_SECTION",
                "bc_type": "Show",
                "cfg_display_template": "landscape"
            },
            {
                "app_type": "show",
                "band_section_id": "SPORT_SECTION",
                "bc_type": "Sport",
                "cfg_display_template": "landscape"
            }
        ];
        var bcShowType = [];
        bcTypes.forEach(function (currentValue) {
          var curreBcType;
          if(showString && showString == 'normal'){
            curreBcType = currentValue.bc_type;
          }
          else{
            curreBcType = currentValue.bc_type.toLowerCase();
          }
          if (currentValue.app_type == type) {
            var currArray = curreBcType.split(',');
            bcShowType = bcShowType.concat(currArray);
          }
        });
        return bcShowType;
    }
})();
if ("serviceWorker" in navigator) {
    navigator.serviceWorker.register('./service-worker.js') //setting scope of sw
    .then(function(registration) {
    console.info('Service worker is registered!');
    checkForPageUpdate(registration);
    showSnackbar();
    })
    .catch(function(error) {
    console.error('Service worker failed ', error);
    });
}

function checkForPageUpdate(registration) {
    registration.addEventListener("updatefound", function() {
    if (navigator.serviceWorker.controller) {
        var installingSW = registration.installing;
        installingSW.onstatechange = function() {
        console.info("Service Worker State :", installingSW.state);
        switch(installingSW.state) {
            case 'installed':
                showSnackbar();
            break;
            case 'redundant':
            throw new Error('The installing service worker became redundant.');
        }
        }
    }
    });
}

function showSnackbar() {
    console.log("Snackbar");
    var snackbarDiv = document.getElementById("snackbar")
    snackbarDiv.innerHTML = "App is ready for Offline use!!";
    snackbarDiv.className = "show";
    setTimeout(function(){ snackbarDiv.className = snackbarDiv.className.replace("show", ""); }, 3000);
}
(function(){
    console.log("Banner Service");
    $('.banner').owlCarousel({
        animateOut: 'slideOutDown',
        animateIn: 'flipInX',
        dots: false,
        items:1,
        smartSpeed:450,
        loop: false,
    });
    $('.load').owlCarousel({
        loop:false,
        margin:10,
        nav:false,
        dots: false,
        responsive:{
            0:{
                items:1
            },
            600:{
                items:3
            },
            1000:{
                items:5
            }
        }
    })
}());