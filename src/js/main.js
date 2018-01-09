import jQuery from 'jquery';

import config from './config';

(function($) {
    const socket = new WebSocket(
        `ws://${config.server.ip}:${config.server.port}`
    );

    const urlParams = new URLSearchParams(window.location.search);
    const $statusPage = $('#status-page');
    const $residentPage = $('#resident-page');

    if (urlParams.has('resident_id')) {
        if (urlParams.has('is_caretaker_coming')) {
            sendCareTakerComingData(urlParams.get('resident_id'), urlParams.get('is_caretaker_coming'));
        }

        handleResidentPage(urlParams.get('resident_id'));
    } else {
        handleStatusPage();
    }

    function sendCareTakerComingData(residentId, value) {
        socket.send({
            id: residentId,
            is_coming: value,
        });
    }

    function handleResidentPage(residentId) {
        $statusPage.hide();
        $residentPage.show();

        socket.onmessage = (event) => {
            const data = JSON.parse(event.data);

            let resident = $.map(data.residents, (resident) => {
                if (resident.id == residentId) {
                    return resident;
                }
            })[0];

            if (!resident) {
                resident = {
                    id: 2,
                    name: "Bert Hendriks",
                    address: "Adresje 17",
                    section: "QPZ33.5",
                    status: "BATTERY_LOW",
                };
            }

            let statusIcon = `<i class="far fa-circle fa-xs" style="color: limegreen;"></i>`;
            let statusHtml = `${statusIcon} In orde`;

            if (resident.low_battery) {
                statusIcon = `<i class="fa fa-circle fa-xs" style="color: orange;"></i>`;
                statusHtml = `${statusIcon} Batterij laag`;
            } else if (resident.is_fallen) {
                statusIcon = `<i class="fa fa-circle fa-xs" style="color: red;"></i>`;
                statusHtml = `${statusIcon} Mogelijk gevallen`;
            }

            $('#resident-page__id').text(`#${resident.id}`);
            $('#resident-page__title').html(`${statusIcon} ${resident.name} (#${resident.id})`);
            $('#resident-page__name').text(resident.name);
            $('#resident-page__location').text(
                `${resident.address}, sectie ${resident.section}`
            );
            $('#resident-page__status').html(statusHtml);

            // If caretaker of resident is coming
            if (resident.is_coming) {
                $('#resident-page__on-the-way').html(
                    `Yes. <a href="?resident_id=${resident.id}&is_caretaker_coming=false">zet uit</a>`
                );
            } else {
                $('#resident-page__on-the-way').html(
                    `No. <a href="?resident_id=${resident.id}&is_caretaker_coming=true">zet aan</a>`
                );
            }
        };
    };

    function handleStatusPage() {
        let residents = [];

        socket.onmessage = (event) => {
            const data = JSON.parse(event.data);
            residents = data.residents;

            if (!residents) {
                residents = [
                    {
                        id: 1,
                        name: "Bert Hendriks",
                        address: "Adresje 17",
                        section: "QPZ33.5",
                        status: "BATTERY_LOW",
                    },
                    {
                        id: 2,
                        name: "Evert Klein",
                        address: "Adresje 17",
                        section: "JKP42.1",
                        status: "OK",
                    },
                    {
                        id: 3,
                        name: "Celine Pepers",
                        address: "Adresje 17",
                        section: "DRJ21.2",
                        status: "OK",
                    },
                    {
                        id: 4,
                        name: "Dirk de Haan",
                        address: "Adresje 17",
                        section: "QPZ33.5",
                        status: "POSSIBLY_FALLEN",
                    },
                    {
                        id: 5,
                        name: "Vanessa van Vliet",
                        address: "Adresje 17",
                        section: "LF94.5",
                        status: "OK",
                    },
                ];
            }

            const $residentsTableRows = $('#residents-table-rows');
            $residentsTableRows.empty();

            $.each(residents, function(i, resident) {
                const $tr = $('<tr>');
                $tr.append($('<td>').text(resident.id));
                $tr.append(
                    $('<td>').html(
                        `<a href="?resident_id=${resident.id}">${resident.name}</a>`
                    )
                );
                $tr.append($('<td>').text(resident.location));

                let statusHtml = `<i class="far fa-circle fa-xs" style="color: limegreen;"></i> In orde`;

                if (resident.status == 'BATTERY_LOW') {
                    statusHtml = `<i class="fa fa-circle fa-xs" style="color:orange;"></i> Batterij laag`;
                } else if (resident.status == 'POSSIBLY_FALLEN') {
                    statusHtml = `<i class="fa fa-circle fa-xs" style="color:red;"></i> Mogelijk gevallen`;
                }

                $tr.append($('<td>').html(statusHtml));
                $tr.append($('<td>'));

                $tr.appendTo($residentsTableRows);
            });

            setInterval(() => {
                socket.send('Ping!');
                console.log('Pinged to server.');
            }, 1000);
        };
    };
})(jQuery);
