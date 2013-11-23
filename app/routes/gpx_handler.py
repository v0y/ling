# encoding: utf-8

import math
from time import strptime
from xml.etree.cElementTree import parse


def handle_gpx(gpx_file):
    # convert gpx to tracks
    tracks = gpx_to_tracks(gpx_file)

    # get additional route data
    start_time, finish_time = get_start_and_finish_times(tracks)
    length, height_up, height_down = get_distance_and_elevations_delta(tracks)

    return (tracks, start_time, finish_time, length, height_up, height_down)


def gpx_to_tracks(gpx_file):
    tree = parse(gpx_file)
    root = tree.getroot()
    namespace = root.tag[:-3]

    # prepare tag identyfiers with namespace
    type_id = '%stype' % namespace
    ele_ns = '%sele' % namespace
    time_ns = '%stime' % namespace

    # get tracks
    tracks = []
    for trk in root.getiterator('%strk' % namespace):
        track = {}

        # track type (eg. RUNNING)
        type_ = trk.find(type_id)
        if type_:
            track['type'] = type_.text

        track['segments'] = []

        for seg in trk.findall('%strkseg' % namespace):
            segment = []
            for pt in seg:
                point = {
                    'lat': pt.attrib['lat'],
                    'lon': pt.attrib['lon'],
                    'ele': pt.find(ele_ns).text,
                    'time': pt.find(time_ns).text,
                }
                segment.append(point)
            track['segments'].append(segment)
        tracks.append(track)

    return tracks


def get_distance_and_elevations_delta(tracks):
    distance = 0
    delta_elevation_up = 0
    delta_elevation_down = 0
    for track in tracks:
        for segment in track['segments']:
            i = 1
            while i < len(segment):
                point1 = segment[i-1]
                point2 = segment[i]

                # get distance
                distance += get_distance(point1, point2)

                # get height difference
                d_ele = point2 - point1
                if d_ele > 0:
                    delta_elevation_up += d_ele
                else:
                    delta_elevation_down += d_ele

                # update counter
                i += 1

    return distance, delta_elevation_up, delta_elevation_down


def get_start_and_finish_times(tracks):
    # get times as strings
    start_time = tracks[0]['segments'][0][0]['time']
    finish_time = tracks[-1]['segments'][-1][-1]['time']

    # convert strings to datetimes
    format = ""     # <<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<< TODO
    return strptime(start_time, format), strptime(finish_time, format)


def get_distance(point1, point2):
    lat1 ,lon1 = point1['lat'], point1['lon']
    lat2, lon2 = point2['lat'], point2['lon']

    dlat = deg2rad(lat2-lat1)
    dlon = deg2rad(lon2-lon1)
    a = math.sin(dlat/2) ** 2 + (math.cos(deg2rad(lat1)) *
        math.cos(deg2rad(lat2)) * math.sin(dlon/2) ** 2)
    return 2 * math.atan2(math.sqrt(a), math.sqrt(1-a)) * 6371


def deg2rad(deg):
    return deg * (math.pi/180)
