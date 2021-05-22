from flask import Flask, redirect, url_for, request,render_template
from flask import request, send_from_directory,session
from flask_cors import CORS
from flaskext.mysql import MySQL
from datetime import datetime
from waitress import serve
import time
import json
import datetime
import hashlib 



app = Flask(__name__)
app.secret_key = "testSTuff"
CORS(app)

@app.route('/')
def index():
    if 'username' in session:
        return render_template('index.html')
    return render_template('login.html')

def connDB():
    mysql = MySQL()
    # MySQL configurations
    #app.config['MYSQL_DATABASE_USER'] = 'root'
    #app.config['MYSQL_DATABASE_PASSWORD'] = ''
    app.config['MYSQL_DATABASE_USER'] = 'dashboard'
    app.config['MYSQL_DATABASE_PASSWORD'] = 'aisoh-Wae<P4'
    app.config['MYSQL_DATABASE_DB'] = 'gpsTrack'
    app.config['MYSQL_DATABASE_PORT'] = 3306
    app.config['MYSQL_DATABASE_HOST'] = 'localhost'
    mysql.init_app(app)
    return mysql.connect()

@app.route('/loginAuth', methods=['POST'])
def loginAuth():
    conn = connDB()
    x = conn.cursor()
    cellphone=request.form['cellphone']
    password=request.form['password']
    baseQuery="select count(1) from users where cellPhone='"+cellphone+"' and password='"+password+"' "
    print(baseQuery)
    x.execute(baseQuery)
    data=x.fetchall()
    finalResult=[]
    for element in data:
        if element[0] > 0:
            session['username'] = cellphone
            finalResult.append({'username':cellphone,'access':'1', })
        else:
            finalResult.append({'username':cellphone,'access':'0', })
    return json.dumps(finalResult)

@app.route('/logout', methods=['POST'])
def logout():
    session.pop('username', None)
    return 'logout'

@app.route('/search', methods=['POST'])
def search():
    conn = connDB()
    x = conn.cursor()
    baseQuery="select gps.cellphone, gps.lat,gps.lon,u.nickname,u.firstName,u.lastName,u.groupValue,gps.timeStamp,u.id from gpshistory as gps left join users as u on u.cellphone = gps.cellphone "
    baseQuery+="where 1=1"
    if(request.form['nickname'] != ''):
        baseQuery+=" and u.nickname in ('"+request.form['nickname']+"')"
    if(request.form['date'] != ''):
        baseQuery+=" and cast(gps.timeStamp as date)='"+request.form['date']+"'"
    if((request.form['startTimeTab'] != '')&(request.form['endTimeTab'] != '')):
        baseQuery+=" and ( cast(gps.timeStamp as time)>='"+request.form['startTimeTab']+"' and cast(gps.timeStamp as time) <='"+request.form['endTimeTab']+"'  )"    
    if(request.form['group'] != ''):
        baseQuery+=" and u.groupValue='"+request.form['group']+"'"
    baseQuery+=" order by gps.timeStamp desc"
    print(baseQuery)
    x.execute(baseQuery)
    data=x.fetchall()
    finalResult=[]
    counter=0
    for element in data:
        finalResult.append({'cellphone':element[0], 'lat': element[1], 'lon': element[2], 'nickname': element[6]+'-'+str(element[8])+'-'+element[3], 'firstName': element[4], 'lastName': element[5], 'groupValue': element[6], 'timeStamp': element[7].strftime('%d-%b-%Y %I:%M:%S %p')})
    return json.dumps(finalResult)

@app.route('/save',methods = ['POST'])
def save():
    conn = connDB()
    x = conn.cursor()
    x.execute("INSERT INTO gpshistory (cellphone,lat,lon,timeStamp) VALUES ('"+request.form['cellNumber']+"','"+request.form['lat']+"','"+request.form['long']+"',NOW())")
    print("INSERT INTO gpshistory (cellphone,lat,lon,timeStamp) VALUES ('"+request.form['cellNumber']+"','"+request.form['lat']+"','"+request.form['long']+"',NOW())")
    conn.commit()
    msg = "Record successfully added"
    x.execute("select intervalCycle from intervals")
    data=x.fetchall()
    finalResult=[]
    counter=0
    for element in data:
        finalResult.append({'minutes':element[0]})
    return json.dumps(finalResult)
@app.route('/savegroup',methods = ['POST'])
def savegroup():
    conn = connDB()
    x = conn.cursor()
    print("INSERT INTO groupElements (groupName,Description) VALUES ('"+request.form['nameGroup']+"','"+request.form['descGroup']+"')")
    x.execute("INSERT INTO groupElements (groupName,Description) VALUES ('"+request.form['nameGroup']+"','"+request.form['descGroup']+"')")
    conn.commit()
    msg = "done"
    return msg
@app.route('/getGroups',methods = ['POST'])
def getGroups():
    conn = connDB()
    x = conn.cursor()
    x.execute("select groupName,Description from groupElements")
    data=x.fetchall()
    finalResult=[]
    counter=0
    for element in data:
        finalResult.append({'groupName':element[0], 'Description': element[1]})    
    return json.dumps(finalResult)

@app.route('/saveIntervalAction',methods = ['POST'])
def saveIntervalAction():
    conn = connDB()
    x = conn.cursor()
    print("update  intervals set intervalCycle="+request.form['interval']+", updated='"+request.form['updated']+"' where 1=1 ")
    x.execute("update  intervals set intervalCycle="+request.form['interval']+", updated='"+request.form['updated']+"' where 1=1 ")
    conn.commit()
    msg = "done"
    return msg

@app.route('/getNickname',methods = ['POST'])
def getNickname():
    conn = connDB()
    x = conn.cursor()
    x.execute("select u.nickname,u.cellPhone, if (( select gps.timeStamp from gpshistory gps where u.cellPhone = gps.cellphone  and DATE_ADD(NOW(), INTERVAL -3 MINUTE) <= gps.timeStamp ORDER BY gps.timeStamp asc limit 1) <> '',1,0) as status from users u where u.groupValue='"+request.form['group']+"' group by nickname,cellPhone,status")
    data=x.fetchall()
    finalResult=[]
    counter=0
    finalResult.append({'nickname':'','cellphone':'','status':0}) 
    for element in data:
        status = False
        finalResult.append({'nickname':element[0],'cellphone':element[1],'status':element[2]})            
    return json.dumps(finalResult)

@app.route('/getDates',methods = ['POST'])
def getDates():
    conn = connDB()
    x = conn.cursor()
    x.execute("select cast(timestamp as date) as dates from gpshistory group by dates order by dates desc")
    data=x.fetchall()
    finalResult=[]
    counter=0
    #print(data)
    for element in data:
        finalResult.append({'date':element[0].strftime('%d-%b-%Y')})    
    return json.dumps(finalResult)

@app.route('/addUserAction',methods = ['POST'])
def addUserAction():
    conn = connDB()
    x = conn.cursor()
    x.execute("INSERT INTO users (nickname,cellPhone,groupvalue,firstName,lastName,dashboarduser,password) VALUES ('"+request.form['nickname']+"','"+request.form['cellPhone']+"','"+request.form['group']+"','','','','')")
    conn.commit()
    msg = "Record successfully added"
    return msg
@app.route('/listUsers',methods = ['POST'])
def listUsers():
    conn = connDB()
    x = conn.cursor()
    x.execute("select nickname,firstName,lastName,cellPhone,groupvalue from users ")
    data=x.fetchall()
    finalResult=[]
    counter=0
    for element in data:
        finalResult.append({'nickname':element[0], 'firstName': element[1], 'lastName': element[2], 'cellPhone': element[3], 'groupvalue': element[4]})    
    return json.dumps(finalResult)

@app.route('/filterDataMap',methods = ['POST'])
def filterDataMap():
    conn = connDB()
    x = conn.cursor()
    baseQuery="SELECT gps.cellphone,gps.lat,gps.lon,u.nickname,u.firstName,u.lastName,u.groupValue FROM users AS u LEFT JOIN (SELECT gpshistory.cellphone,gpshistory.lat,gpshistory.lon FROM gpshistory where cast(gpshistory.timeStamp as date)='"+request.form['date']+"' "
    if((request.form['startTimeMap'] != '')&(request.form['endTimeMap'] != '')):
        baseQuery+=" and ( cast(gpshistory.timeStamp as time)>='"+request.form['startTimeMap']+"' and cast(gpshistory.timeStamp as time) <='"+request.form['endTimeMap']+"'  )"    
    baseQuery+=" GROUP BY cellphone,lat,lon) gps ON u.cellphone = gps.cellphone WHERE  gps.lat IS NOT  null "
    if(request.form['nickname'] != ''):
        baseQuery+=" and u.nickname='"+request.form['nickname']+"'"    
    if(request.form['group'] != ''):
        baseQuery+=" and u.groupValue='"+request.form['group']+"'"
    #baseQuery+="group by gps.cellphone, gps.lat,gps.lon,u.nickname,u.firstName,u.lastName,u.groupValue"
    print(baseQuery)
    x.execute(baseQuery)
    data=x.fetchall()
    finalResult=[]
    counter=0
    for element in data:
        finalResult.append({'cellphone':element[0], 'lat': element[1], 'lon': element[2], 'nickname': element[3], 'firstName': element[4], 'lastName': element[5], 'groupValue': element[6]})    
    return json.dumps(finalResult)

if __name__ == '__main__':
    #app.run(host= '0.0.0.0',threaded=True, port=8080,ssl_context='adhoc')
    serve(app, host='0.0.0.0', port=8080)
