(function() {

    'use strict';

    angular.module('phdApp', [])
        .controller('SearchLocate', ['$scope', '$log', '$http', function($scope, $log, $http) {
                $scope.searchContainer = "none;";
                $scope.classifyContainer = "none;";
                $scope.filtersData = "none;";
                $scope.contactContainer = "none";
                $scope.resultsSearch = "none";
                $scope.listUsersContainer = "none;";
                $scope.inputSearch = '';
                $scope.uploadFinish = '';
                $scope.itemValues = null;
                $scope.nicknameTabFilter = { nickname: '' };
                $scope.nicknameMapFilter = { nickname: '' };
                $scope.listUsersInfo = null;
                $scope.dateFilterTab = null;
                $scope.assetLayerGroup = new L.LayerGroup();
                $scope.markers = []

                $.ajax({
                    url: '/getGroups',
                    type: "post"
                }).done(function(data) {
                    var groupElements = $.parseJSON(data);
                    $scope.itemValues = groupElements;
                });
                $.ajax({
                    url: '/getDates',
                    type: "post"
                }).done(function(data) {
                    var dateFilterTab = $.parseJSON(data);
                    $scope.dateFilterTab = dateFilterTab;
                });
                $scope.populateOnlineUsers = function(info) {
                    $('#usersOnlineWrapper').html('')
                    if ($('#usersOnlineWrapper').data('selectedElement') == $('#groupFilterTab').val()) {
                        var wrapper = $('#usersOnlineWrapper')
                        wrapper.append('<ul class="list-group">')
                        var activeClass = '',
                            statusText = '';
                        $.each(info, function(i, info) {
                            if (info.cellphone != '') {
                                activeClass = '';
                                statusText = 'Offline';
                                if (info.status == 1) {
                                    activeClass = 'active'
                                    statusText = 'Online';
                                }

                                wrapper.append('<li class="list-group-item ' + activeClass + '">' + info.cellphone + '  ' + statusText + ' </li>');
                                setTimeout(function() {
                                    $scope.onGroupChange($('#groupFilterTab').val());
                                    console.log('checking...')
                                }, 3 * 60 * 1000);
                            }
                        });
                        wrapper.append('</ul>')
                    } else {
                        return false;
                    }
                }
                $scope.onGroupChange = function(value) {
                    $('#usersOnlineWrapper').data('selectedElement', value);
                    $.ajax({
                        url: '/getNickname',
                        data: {
                            group: value
                        },
                        type: "post"
                    }).done(function(data) {
                        var nicknameTabFilter = $.parseJSON(data);
                        $scope.populateOnlineUsers(nicknameTabFilter)
                        $scope.nicknameTabFilter = nicknameTabFilter;
                    });
                }
                $scope.onGroupChangeMap = function(value) {
                    $.ajax({
                        url: '/getNickname',
                        data: {
                            group: value
                        },
                        type: "post"
                    }).done(function(data) {
                        var nicknameTabFilter = $.parseJSON(data);
                        $scope.nicknameMapFilter = nicknameTabFilter;
                    });
                }
                $scope.clean = function() {
                    $scope.searchContainer = "none;";
                    $scope.classifyContainer = "none;";
                    $scope.contactContainer = "none";
                    $scope.resultsSearch = "none";
                    $scope.listUsersContainer = "none;";
                    $scope.filtersData = "none;";
                }
                $scope.cleanTabularFilters = function() {
                    $('#groupFilterTab').val('')
                    $('#dateFilterTab').val('')
                    $('#nickFilterTab').val('')
                    $('#startTimeTab').val('')
                    $('#endTimeTab').val('')
                }
                $scope.cleanMapFilters = function() {
                    $('#groupFilter').val('')
                    $('#dateFilterMap').val('')
                    $('#nicknameFilter').val('')
                    $('#startTimeMap').val('')
                    $('#endTimeMap').val('')
                    for (var i = $scope.markers.length - 1; i >= 0; i--) {
                        $scope.markers[i].remove();
                    }
                }
                $scope.dashboard = function() {
                    $scope.filtersData = "block;";
                    $scope.classifyContainer = "none;";
                    $scope.contactContainer = "none";
                    $scope.resultsSearch = "none";
                    $scope.listUsersContainer = "none;";
                }
                $scope.searchTabular = function() {
                    if (($('#groupFilterTab').val() == '') || ($('#dateFilterTab').val() == '')) {
                        alert('Selecciona una Red y Fecha.');
                        return false;
                    }

                    $('#positionsDataInfo').DataTable().destroy();
                    $scope.positions = null;
                    $scope.resultsSearch = "none;";
                    $http({
                        method: 'POST',
                        url: '/search',
                        headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
                        data: $.param({
                            nickname: $('#nickFilterTab').val(),
                            group: $('#groupFilterTab').val(),
                            startTimeTab: $('#startTimeTab').val(),
                            endTimeTab: $('#endTimeTab').val(),
                            date: moment($('#dateFilterTab').val(), 'DD-MMM-YYYY').format('YYYY-MM-DD')
                        })
                    }).
                    success(function(data, status, headers, config) {
                        $('title').html($('#groupFilterTab').val() + '-' + $('#dateFilterTab').val())
                        $scope.resultsSearch = "block;";
                        $scope.positions = data;
                        if ($scope.positions.length == 0) {
                            $scope.resultsSearch = "none;";
                            alert('No existen registros con estos filtros!')
                        } else {
                            var wrapper = $('#tableContent');
                            wrapper.html('');
                            $.each(data, function(i, posData) {
                                wrapper.append('<tr><td>' + posData.nickname + '</td><td >' + posData.cellphone + '</td><td>' + posData.lat + '</td><td>' + posData.lon + '</td><td >' + posData.timeStamp + '</td></tr>');
                            });
                            $('#positionsDataInfo').DataTable({
                                dom: 'Bfrtip',
                                "iDisplayLength": 10
                            });
                            $('#positionsDataInfo').show();
                        }
                    }).
                    error(function(data, status, headers, config) {
                        console.log('something went wrong');
                    });
                }
                $scope.listUsers = function() {
                    $http({
                        method: 'POST',
                        url: '/listUsers'
                    }).
                    success(function(data, status, headers, config) {
                        $scope.listUsersInfo = data;
                        setTimeout(function() {
                            $('#tableUsers').DataTable();
                            $('#tableUsers').show();
                        }, 1000);
                    }).
                    error(function(data, status, headers, config) {
                        console.log('something went wrong');
                    });
                    $scope.listUsersContainer = "block;";
                    $scope.searchContainer = "none;";
                    $scope.filtersData = "none;";
                    $scope.classifyContainer = "none;";
                    $scope.contactContainer = "none";
                    $scope.resultsSearch = "none";
                }
                $scope.filterDataMap = function() {
                    if (($('#groupFilter').val() == '') || ($('#dateFilterMap').val() == '')) {
                        alert('Selecciona una Red y Fecha.');
                        return false;
                    }
                    $.ajax({
                        url: '/filterDataMap',
                        type: "post",
                        data: {
                            nickname: $('#nicknameFilter').val(),
                            group: $('#groupFilter').val(),
                            startTimeMap: $('#startTimeMap').val(),
                            endTimeMap: $('#endTimeMap').val(),
                            date: moment($('#dateFilterMap').val(), 'DD-MMM-YYYY').format('YYYY-MM-DD')
                        }
                    }).done(function(data) {
                        console.log(data);
                        var info = $.parseJSON(data);

                        $scope.assetLayerGroup.clearLayers();
                        if (info.length == 0) {
                            $scope.resultsSearch = "none;";
                            alert('No existen registros con estos filtros!')
                        } else {
                            $.each(info, function(i, item) {
                                //var marker1 = L.marker([item.lat, item.lon], { color: '#ffffff' }).bindPopup(item.nickname);
                                var popup = new mapboxgl.Popup()
                                  .setText(item.nickname)
                                  .addTo(mymap);
                                var marker1 = new mapboxgl.Marker()
                                .setLngLat([item.lon,item.lat]).addTo(mymap).setPopup(popup);
                                $scope.markers.push(marker1)
                                //$scope.assetLayerGroup.addLayer(marker1);
                                //$scope.assetLayerGroup.addTo(mymap);
                            });
                        }

                    });
                }

                $scope.classify = function() {

                    $scope.assetLayerGroup.clearLayers();
                    $scope.uploadFinish = '';
                    $scope.classifyContainer = "block;";
                    $scope.searchContainer = "none;";
                    $scope.listUsersContainer = "none;";
                    $scope.contactContainer = "none";
                    $scope.filtersData = "none;";
                    $scope.resultsSearch = "none";
                }
                $scope.contact = function() {
                    $scope.contactContainer = "block";
                    $scope.searchContainer = "none;";
                    $scope.classifyContainer = "none;";
                    $scope.filtersData = "none;";
                    $scope.resultsSearch = "none";
                }
                $scope.addUser = function() {
                    $('#addUser').modal();
                }
                $scope.addGroup = function() {
                    $('#addGroup').modal();
                }
                $scope.logout = function() {
                    $.ajax({
                        url: '/logout',
                        type: "post",
                        data: {
                            exit: true
                        }
                    }).done(function() {
                        window.location = '/'
                    });
                }
                $scope.addGroupAction = function() {
                    var elementVal = $('#nameGroup').val();
                    $.ajax({
                        url: '/savegroup',
                        type: "post",
                        data: {
                            nameGroup: elementVal,
                            descGroup: $('#descGroup').val()
                        }
                    }).done(function() {
                        alert('Grupo Agregado');
                        $('#group').append('<option value=' + elementVal + ' >' + elementVal + '</option>')
                        $('#nameGroup').val('');
                        $('#descGroup').val('');
                    });
                }
                $scope.addInterval = function() {
                    $('#addTimer').modal();
                }
                $scope.saveIntervalAction = function() {
                    $.ajax({
                        url: '/saveIntervalAction',
                        type: "post",
                        data: {
                            interval: $('#intervalValue').val(),
                            updated: 'Dashboard'
                        }
                    }).done(function() {
                        alert('Intervalo Actualizado');
                    });
                }
                $scope.addUserAction = function() {
                    $.ajax({
                        url: '/addUserAction',
                        type: "post",
                        data: {
                            nickname: $('#nickname').val(),
                            cellPhone: $('#cellPhone').val(),
                            group: $('#group').val()
                        }
                    }).done(function() {
                        alert('Usuario Agregado');
                        $('#nickname').val('');
                        $('#cellPhone').val('');
                        $('#group').val('');
                    });
                }

            }

        ]);

}());
