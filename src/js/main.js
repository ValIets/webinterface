import jQuery from 'jquery';

import config from './config';

(function($) {
    const socket = new WebSocket(
        `ws://${config.server.ip}:${config.server.port}`
    );

    let residents = [];

    socket.onmessage = (event) => {
        const data = JSON.parse(event.data);
        residents = data.residents;

        if (residents.length == 0) {
            console.log('No residents found.');
        }

        const urlParams = new URLSearchParams(window.location.search);
        const $statusPage = $('#status-page');
        const $residentPage = $('#resident-page');

        if (urlParams.has('resident_id')) {
            const residentId = urlParams.get('resident_id');

            if (urlParams.has('is_caretaker_coming')) {
                sendCareTakerComingData(
                    residentId,
                    urlParams.get('is_caretaker_coming')
                );

                setTimeout(() => {
                    $(location).attr('href', `?resident_id=${residentId}`);
                }, 2000);
            } else {
                handleResidentPage(residentId);
            }
        } else {
            handleStatusPage();
        }

        function sendCareTakerComingData(residentId, value) {
            socket.send(JSON.stringify({
                id: new Number(residentId),
                is_coming: (value == 'true') ? true : false,
            }));
        }

        function handleResidentPage(residentId) {
            $statusPage.hide();
            $residentPage.show();

            let resident = $.map(residents, (resident) => {
                if (resident.id == residentId) {
                    return resident;
                }
            })[0];

            if (!resident) {
                console.log('Resident not found.');
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

            const residentName = `${resident.firstname} ${resident.surname}`;

            $('#resident-page__id').text(`#${resident.id}`);
            $('#resident-page__title').html(`${statusIcon} ${residentName} (#${resident.id})`);
            $('#resident-page__name').text(residentName);
            $('#resident-page__location').text(
                `${resident.address}, sectie ${resident.section}`
            );
            $('#resident-page__status').html(statusHtml);

            if (resident.is_fallen) {
                // If caretaker of resident is coming
                if (resident.is_coming) {
                    $('#resident-page__on-the-way').html(
                        `<p>Onderweg.</p><a href="?resident_id=${resident.id}&is_caretaker_coming=false" class="button small">Zet op "niet onderweg"</a>`
                    );
                } else {
                    $('#resident-page__on-the-way').html(
                        `<p>Niet onderweg.</p><a href="?resident_id=${resident.id}&is_caretaker_coming=true" class="button small">Zet op "onderweg"</a>`
                    );
                }
            }
        };

        function handleStatusPage() {
            const $residentsTableRows = $('#residents-table-rows');
            $residentsTableRows.empty();

            $.each(residents, function(i, resident) {
                const $tr = $('<tr>');
                $tr.append($('<td>').text(resident.id));
                $tr.append(
                    $('<td>').html(
                        `<a href="?resident_id=${resident.id}">${`${resident.firstname} ${resident.surname}`}</a>`
                    )
                );
                $tr.append($('<td>').text(resident.location));

                let statusHtml = `<i class="far fa-circle fa-xs" style="color: limegreen;"></i> In orde`;

                if (resident.low_battery) {
                    statusHtml = `<i class="fa fa-circle fa-xs" style="color: orange;"></i> Batterij laag`;
                } else if (resident.is_fallen) {
                    statusHtml = `<i class="fa fa-circle fa-xs" style="color: red;"></i> Mogelijk gevallen`;
                }

                $tr.append($('<td>').html(statusHtml));
                $tr.append($('<td>'));

                $tr.appendTo($residentsTableRows);
            });
    };
    };
})(jQuery);
